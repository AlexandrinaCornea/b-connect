import { eq, desc } from 'drizzle-orm'
import { db, reviews, users } from '../../db/index'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const result = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewer: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.reviewedUserId, userId))
    .orderBy(desc(reviews.createdAt))

  return result
})
