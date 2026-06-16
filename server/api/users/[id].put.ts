import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, users } from '../../db/index'
import { getServerSession } from '#auth'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Neautentificat' })
  }

  const id = getRouterParam(event, 'id')
  if ((session.user as any).id !== id) {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.errors[0].message })
  }

  const [updated] = await db
    .update(users)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(users.id, id!))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      city: users.city,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
    })

  return updated
})
