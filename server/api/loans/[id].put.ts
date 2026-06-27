import { eq, or, and } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  loanRequests,
  books,
  notifications,
  conversations,
  messages,
} from "../../db/index";
import { getServerSession } from "#auth";

const updateLoanSchema = z.object({
  status: z.enum(["accepted", "active", "rejected", "cancelled"]),
});

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID lipsă" });

  const [loan] = await db
    .select()
    .from(loanRequests)
    .where(eq(loanRequests.id, id))
    .limit(1);
  if (!loan)
    throw createError({ statusCode: 404, message: "Cererea nu există" });

  const body = await readBody(event);
  const result = updateLoanSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    });
  }

  const { status } = result.data;
  const userId = (session.user as any).id;

  if (
    (status === "accepted" || status === "active" || status === "rejected") &&
    loan.ownerId !== userId
  ) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }
  if (status === "cancelled" && loan.borrowerId !== userId) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, loan.bookId))
    .limit(1);

  const [updated] = await db
    .update(loanRequests)
    .set({ status, respondedAt: new Date() })
    .where(eq(loanRequests.id, id))
    .returning();

  if (status === "accepted") {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.user1Id, loan.ownerId),
            eq(conversations.user2Id, loan.borrowerId),
          ),
          and(
            eq(conversations.user1Id, loan.borrowerId),
            eq(conversations.user2Id, loan.ownerId),
          ),
        ),
      )
      .limit(1);

    let conv = existing;
    if (!conv) {
      const [newConv] = await db
        .insert(conversations)
        .values({ user1Id: loan.ownerId, user2Id: loan.borrowerId })
        .returning();
      conv = newConv;
    }

    await db.insert(messages).values({
      conversationId: conv.id,
      senderId: loan.ownerId,
      content: `Salut! Am acceptat cererea ta pentru „${book?.title}". Hai să aranjăm o întâlnire pentru predarea cărții!`,
    });

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conv.id));

    await db.insert(notifications).values({
      userId: loan.borrowerId,
      type: "loan_accepted",
      message: `Cererea ta pentru „${book?.title}" a fost acceptată. Verifică mesajele pentru detalii!`,
      relatedId: loan.id,
    });
  }

  if (status === "active") {
    await db
      .update(books)
      .set({ status: "borrowed" })
      .where(eq(books.id, loan.bookId));
    await db.insert(notifications).values({
      userId: loan.borrowerId,
      type: "loan_accepted",
      message: `Predarea cărții „${book?.title}" a fost confirmată. Împrumutul este activ!`,
      relatedId: loan.id,
    });
  }

  if (status === "rejected") {
    await db.insert(notifications).values({
      userId: loan.borrowerId,
      type: "loan_rejected",
      message: `Cererea ta pentru „${book?.title}" a fost respinsă.`,
      relatedId: loan.id,
    });
  }

  return updated;
});
