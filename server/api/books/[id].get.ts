import { eq } from 'drizzle-orm'
import { db, books, users } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const [book] = await db
    .select({
      id: books.id,
      ownerId: books.ownerId,
      title: books.title,
      author: books.author,
      genre: books.genre,
      description: books.description,
      imageUrl: books.imageUrl,
      pageCount: books.pageCount,
      publishedYear: books.publishedYear,
      status: books.status,
      createdAt: books.createdAt,
      owner: {
        id: users.id,
        name: users.name,
        city: users.city,
        ratingSum: users.ratingSum,
        ratingCount: users.ratingCount,
      },
    })
    .from(books)
    .innerJoin(users, eq(books.ownerId, users.id))
    .where(eq(books.id, id))
    .limit(1)

  if (!book) throw createError({ statusCode: 404, message: 'Cartea nu există' })

  return book
})
