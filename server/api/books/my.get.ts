import { eq, desc } from 'drizzle-orm'
import { db, books } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Neautentificat' })
  }

  const result = await db
    .select()
    .from(books)
    .where(eq(books.ownerId, (session.user as any).id))
    .orderBy(desc(books.createdAt))

  return result
})
