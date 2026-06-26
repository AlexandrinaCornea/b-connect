import { or, eq, desc, and } from "drizzle-orm";
import { db, loanRequests, books, users, reviews } from "../../db/index";
import { getServerSession } from "#auth";
import { alias } from "drizzle-orm/pg-core";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;

  const borrowerAlias = alias(users, "borrower");
  const ownerAlias = alias(users, "owner");

  const result = await db
    .select({
      id: loanRequests.id,
      status: loanRequests.status,
      borrowerId: loanRequests.borrowerId,
      ownerId: loanRequests.ownerId,
      requestedAt: loanRequests.requestedAt,
      returnedAt: loanRequests.returnedAt,
      dueDate: loanRequests.dueDate,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        imageUrl: books.imageUrl,
      },
      borrower: {
        id: borrowerAlias.id,
        name: borrowerAlias.name,
      },
      owner: {
        id: ownerAlias.id,
        name: ownerAlias.name,
      },
    })
    .from(loanRequests)
    .innerJoin(books, eq(loanRequests.bookId, books.id))
    .innerJoin(borrowerAlias, eq(loanRequests.borrowerId, borrowerAlias.id))
    .innerJoin(ownerAlias, eq(loanRequests.ownerId, ownerAlias.id))
    .where(
      or(eq(loanRequests.borrowerId, userId), eq(loanRequests.ownerId, userId)),
    )
    .orderBy(desc(loanRequests.requestedAt));

  const withReview = await Promise.all(
    result.map(async (loan) => {
      if (loan.status !== "returned") return { ...loan, hasReviewed: false };
      const existing = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(and(eq(reviews.loanId, loan.id), eq(reviews.reviewerId, userId)))
        .limit(1);
      return { ...loan, hasReviewed: existing.length > 0 };
    }),
  );

  return withReview;
});
