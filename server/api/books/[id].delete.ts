import { eq } from 'drizzle-orm'
import { db, books } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1)
  if (!book) throw createError({ statusCode: 404, message: 'Cartea nu există' })
  if (book.ownerId !== (session.user as any).id) {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  await db.delete(books).where(eq(books.id, id))

  return { success: true }
})
