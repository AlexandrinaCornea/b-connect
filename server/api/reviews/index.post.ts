import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db, reviews, loanRequests, users } from "../../db/index";
import { getServerSession } from "#auth";

const createReviewSchema = z.object({
  loanId: z.string().min(1),
  reviewedUserId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const body = await readBody(event);
  const result = createReviewSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    });
  }

  const { loanId, reviewedUserId, rating, comment } = result.data;
  const reviewerId = (session.user as any).id;

  const [loan] = await db
    .select()
    .from(loanRequests)
    .where(eq(loanRequests.id, loanId))
    .limit(1);
  if (!loan)
    throw createError({ statusCode: 404, message: "Împrumutul nu există" });
  if (loan.status !== "returned") {
    throw createError({
      statusCode: 400,
      message: "Poți lăsa review doar după returnare",
    });
  }

  if (loan.borrowerId !== reviewerId && loan.ownerId !== reviewerId) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  const existing = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.loanId, loanId), eq(reviews.reviewerId, reviewerId)))
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Ai lăsat deja un review pentru acest împrumut",
    });
  }

  const [newReview] = await db
    .insert(reviews)
    .values({
      loanId,
      reviewerId,
      reviewedUserId,
      rating,
      comment: comment ?? null,
    })
    .returning();

  const [reviewedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, reviewedUserId))
    .limit(1);
  await db
    .update(users)
    .set({
      ratingSum: reviewedUser.ratingSum + rating,
      ratingCount: reviewedUser.ratingCount + 1,
    })
    .where(eq(users.id, reviewedUserId));

  return newReview;
});
