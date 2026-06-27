import { db, favorites } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  const userId = (session.user as any).id
  const { bookId } = await readBody(event)
  if (!bookId) throw createError({ statusCode: 400, message: 'bookId lipsă' })

  const result = await db.insert(favorites).values({ userId, bookId }).returning()
  return result[0]
})
