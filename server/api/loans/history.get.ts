import { or, eq, desc } from 'drizzle-orm'
import { db, loanRequests, books, users } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const userId = (session.user as any).id

  const result = await db
    .select({
      id: loanRequests.id,
      status: loanRequests.status,
      requestedAt: loanRequests.requestedAt,
      returnedAt: loanRequests.returnedAt,
      dueDate: loanRequests.dueDate,
      role: or(eq(loanRequests.borrowerId, userId)),
      book: {
        id: books.id,
        title: books.title,
        author: books.author,
        imageUrl: books.imageUrl,
      },
      borrower: {
        id: users.id,
        name: users.name,
      },
    })
    .from(loanRequests)
    .innerJoin(books, eq(loanRequests.bookId, books.id))
    .innerJoin(users, eq(loanRequests.borrowerId, users.id))
    .where(
      or(
        eq(loanRequests.borrowerId, userId),
        eq(loanRequests.ownerId, userId)
      )
    )
    .orderBy(desc(loanRequests.requestedAt))

  return result
})
