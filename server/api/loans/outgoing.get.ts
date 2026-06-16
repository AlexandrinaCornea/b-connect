import { eq, desc } from 'drizzle-orm'
import { db, loanRequests, books, users } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const result = await db
    .select({
      id: loanRequests.id,
      status: loanRequests.status,
      message: loanRequests.message,
      dueDate: loanRequests.dueDate,
      requestedAt: loanRequests.requestedAt,
      respondedAt: loanRequests.respondedAt,
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        imageUrl: books.imageUrl,
      },
      owner: {
        id: users.id,
        name: users.name,
        city: users.city,
      },
    })
    .from(loanRequests)
    .innerJoin(books, eq(loanRequests.bookId, books.id))
    .innerJoin(users, eq(loanRequests.ownerId, users.id))
    .where(eq(loanRequests.borrowerId, (session.user as any).id))
    .orderBy(desc(loanRequests.requestedAt))

  return result
})
