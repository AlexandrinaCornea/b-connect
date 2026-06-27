import { eq, desc } from 'drizzle-orm'
import { db, loanRequests, books, users } from '../../db/index'
import { getServerSession } from '#auth'
import { alias } from 'drizzle-orm/pg-core'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  if ((session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const borrower = alias(users, 'borrower')
  const owner = alias(users, 'owner')

  const result = await db
    .select({
      id: loanRequests.id,
      status: loanRequests.status,
      requestedAt: loanRequests.requestedAt,
      startDate: loanRequests.startDate,
      dueDate: loanRequests.dueDate,
      book: { id: books.id, title: books.title, author: books.author, imageUrl: books.imageUrl },
      borrower: { id: borrower.id, name: borrower.name, email: borrower.email },
      owner: { id: owner.id, name: owner.name, email: owner.email },
    })
    .from(loanRequests)
    .innerJoin(books, eq(loanRequests.bookId, books.id))
    .innerJoin(borrower, eq(loanRequests.borrowerId, borrower.id))
    .innerJoin(owner, eq(loanRequests.ownerId, owner.id))
    .orderBy(desc(loanRequests.requestedAt))

  return result
})
