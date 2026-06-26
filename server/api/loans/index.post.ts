import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, books, loanRequests, notifications } from "../../db/index";
import { getServerSession } from "#auth";

const createLoanSchema = z.object({
  bookId: z.string().min(1),
  message: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const body = await readBody(event);
  const result = createLoanSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    });
  }

  const { bookId, message, startDate, dueDate } = result.data;
  const borrowerId = (session.user as any).id;

  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);
  if (!book)
    throw createError({ statusCode: 404, message: "Cartea nu există" });
  if (book.status !== "available") {
    throw createError({
      statusCode: 409,
      message: "Cartea nu este disponibilă",
    });
  }
  if (book.ownerId === borrowerId) {
    throw createError({
      statusCode: 400,
      message: "Nu poți împrumuta propria carte",
    });
  }

  const [loan] = await db
    .insert(loanRequests)
    .values({
      bookId,
      borrowerId,
      ownerId: book.ownerId,
      message: message ?? null,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    })
    .returning();

  await db.insert(notifications).values({
    userId: book.ownerId,
    type: "loan_request",
    message: `${session.user?.name} a solicitat împrumutul cărții "${book.title}"`,
    relatedId: loan.id,
  });

  return loan;
});
