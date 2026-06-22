import { desc, sql } from 'drizzle-orm'
import { db, users, books } from '../../../db/index'
import { getServerSession } from '#auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  if ((session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      city: users.city,
      role: users.role,
      ratingSum: users.ratingSum,
      ratingCount: users.ratingCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return result
})
