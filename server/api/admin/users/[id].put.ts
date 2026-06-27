import { eq } from 'drizzle-orm'
import { db, users } from '../../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  if ((session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const body = await readBody<{ role?: 'user' | 'admin'; banned?: boolean }>(event)

  const update: Record<string, any> = { updatedAt: new Date() }
  if (body.role !== undefined) {
    if (!['user', 'admin'].includes(body.role)) {
      throw createError({ statusCode: 400, message: 'Rol invalid' })
    }
    update.role = body.role
  }
  if (body.banned !== undefined) {
    update.banned = body.banned
  }

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, banned: users.banned })

  if (!updated) throw createError({ statusCode: 404, message: 'Utilizatorul nu există' })

  return updated
})
