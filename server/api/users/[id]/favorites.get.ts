import { eq } from 'drizzle-orm'
import { db, favorites, books } from '../../../db/index'

export default defineEventHandler(async (event) => {
  const targetId = getRouterParam(event, 'id')
  if (!targetId) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const result = await db
    .select({
      id: favorites.id,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        imageUrl: books.imageUrl,
        status: books.status,
      },
    })
    .from(favorites)
    .innerJoin(books, eq(favorites.bookId, books.id))
    .where(eq(favorites.userId, targetId))

  return result
})
