import { desc } from 'drizzle-orm'
import { db, books, users } from '../../../db/index'
import { getServerSession } from '#auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  if ((session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const result = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      status: books.status,
      imageUrl: books.imageUrl,
      createdAt: books.createdAt,
      owner: {
        id: users.id,
        name: users.name,
        email: users.email,
        city: users.city,
      },
    })
    .from(books)
    .innerJoin(users, eq(books.ownerId, users.id))
    .orderBy(desc(books.createdAt))

  return result
})
