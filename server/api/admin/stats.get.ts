import { eq, count } from 'drizzle-orm'
import { db, users, books, loanRequests } from '../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })
  if ((session.user as any).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const [[totalUsers], [totalBooks], [activeLoans], [bannedUsers]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(books),
    db.select({ count: count() }).from(loanRequests).where(eq(loanRequests.status, 'active')),
    db.select({ count: count() }).from(users).where(eq(users.banned, true)),
  ])

  return {
    totalUsers: totalUsers.count,
    totalBooks: totalBooks.count,
    activeLoans: activeLoans.count,
    bannedUsers: bannedUsers.count,
  }
})
