import { eq, and } from 'drizzle-orm'
import { db, favorites } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) return { isFavorite: false }
  const userId = (session.user as any).id
  const { bookId } = getQuery(event)
  if (!bookId) throw createError({ statusCode: 400, message: 'bookId lipsă' })

  const result = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId as string)))
    .limit(1)

  return { isFavorite: result.length > 0 }
})
