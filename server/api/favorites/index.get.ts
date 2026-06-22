import { eq, desc } from 'drizzle-orm'
import { db, favorites, books, users } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const userId = (session.user as any).id

  const result = await db
    .select({
      id: favorites.id,
      createdAt: favorites.createdAt,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        imageUrl: books.imageUrl,
        status: books.status,
        ownerId: books.ownerId,
      },
      owner: {
        id: users.id,
        name: users.name,
        city: users.city,
      },
    })
    .from(favorites)
    .innerJoin(books, eq(favorites.bookId, books.id))
    .innerJoin(users, eq(books.ownerId, users.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))

  return result
})
