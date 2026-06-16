import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, loanRequests, books, notifications } from "../../db/index";
import { getServerSession } from "#auth";

const updateLoanSchema = z.object({
  status: z.enum(["active", "rejected", "cancelled"]),
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
    (status === "active" || status === "rejected") &&
    loan.ownerId !== userId
  ) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  if (status === "cancelled" && loan.borrowerId !== userId) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  const [updated] = await db
    .update(loanRequests)
    .set({ status, respondedAt: new Date() })
    .where(eq(loanRequests.id, id))
    .returning();

  if (status === "active") {
    await db
      .update(books)
      .set({ status: "borrowed" })
      .where(eq(books.id, loan.bookId));
  }

  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, loan.bookId))
    .limit(1);
  const notifType = status === "active" ? "loan_accepted" : "loan_rejected";
  const notifMsg =
    status === "active"
      ? `Cererea ta pentru "${book?.title}" a fost acceptată`
      : `Cererea ta pentru "${book?.title}" a fost respinsă`;

  if (status !== "cancelled") {
    await db.insert(notifications).values({
      userId: loan.borrowerId,
      type: notifType,
      message: notifMsg,
      relatedId: loan.id,
    });
  }

  return updated;
});
