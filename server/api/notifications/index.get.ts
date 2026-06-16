import { eq, desc } from 'drizzle-orm'
import { db, notifications } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, (session.user as any).id))
    .orderBy(desc(notifications.createdAt))

  return result
})
