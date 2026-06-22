import { eq, and } from 'drizzle-orm'
import { db, favorites } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) return { isFavorite: false }

  const userId = (session.user as any).id
  const { bookId } = getQuery(event)

  if (!bookId) return { isFavorite: false }

  const [fav] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId as string)))
    .limit(1)

  return { isFavorite: !!fav, favoriteId: fav?.id }
})
