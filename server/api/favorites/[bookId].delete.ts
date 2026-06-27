import { eq, and } from 'drizzle-orm'
import { db, favorites } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  const userId = (session.user as any).id
  const bookId = getRouterParam(event, 'bookId')
  if (!bookId) throw createError({ statusCode: 400, message: 'ID lipsă' })

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)))
  return { ok: true }
})
