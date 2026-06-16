import { eq } from "drizzle-orm";
import { db, loanRequests, books, notifications } from "../../../db/index";
import { getServerSession } from "#auth";

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
  if (loan.status !== "active") {
    throw createError({ statusCode: 400, message: "Împrumutul nu este activ" });
  }

  const userId = (session.user as any).id;
  if (loan.ownerId !== userId && loan.borrowerId !== userId) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  const [updated] = await db
    .update(loanRequests)
    .set({ status: "returned", returnedAt: new Date() })
    .where(eq(loanRequests.id, id))
    .returning();

  await db
    .update(books)
    .set({ status: "available" })
    .where(eq(books.id, loan.bookId));

  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, loan.bookId))
    .limit(1);
  const notifUserId = userId === loan.ownerId ? loan.borrowerId : loan.ownerId;

  await db.insert(notifications).values({
    userId: notifUserId,
    type: "loan_returned",
    message: `Cartea "${book?.title}" a fost marcată ca returnată`,
    relatedId: loan.id,
  });

  return updated;
});
