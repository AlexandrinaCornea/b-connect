import { eq } from 'drizzle-orm'
import { db, notifications } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const [notif] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1)
  if (!notif) throw createError({ statusCode: 404, message: 'Notificarea nu există' })
  if (notif.userId !== (session.user as any).id) {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id))
    .returning()

  return updated
})
