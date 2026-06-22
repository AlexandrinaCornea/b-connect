import { eq, or, and } from 'drizzle-orm'
import { db, friendships, users } from '../../db/index'
import { getServerSession } from '#auth'
import { alias } from 'drizzle-orm/pg-core'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const userId = (session.user as any).id

  const requester = alias(users, 'requester')
  const addressee = alias(users, 'addressee')

  const result = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      createdAt: friendships.createdAt,
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
      requester: {
        id: requester.id,
        name: requester.name,
        city: requester.city,
        avatarUrl: requester.avatarUrl,
      },
      addressee: {
        id: addressee.id,
        name: addressee.name,
        city: addressee.city,
        avatarUrl: addressee.avatarUrl,
      },
    })
    .from(friendships)
    .innerJoin(requester, eq(friendships.requesterId, requester.id))
    .innerJoin(addressee, eq(friendships.addresseeId, addressee.id))
    .where(
      or(
        eq(friendships.requesterId, userId),
        eq(friendships.addresseeId, userId)
      )
    )

  return result
})
