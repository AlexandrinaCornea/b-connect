import { eq, or, and } from 'drizzle-orm'
import { db, friendships, users } from '../../../db/index'
import { alias } from 'drizzle-orm/pg-core'

export default defineEventHandler(async (event) => {
  const targetId = getRouterParam(event, 'id')
  if (!targetId) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const requester = alias(users, 'requester')
  const addressee = alias(users, 'addressee')

  const result = await db
    .select({
      id: friendships.id,
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
      requester: { id: requester.id, name: requester.name, city: requester.city },
      addressee: { id: addressee.id, name: addressee.name, city: addressee.city },
    })
    .from(friendships)
    .innerJoin(requester, eq(friendships.requesterId, requester.id))
    .innerJoin(addressee, eq(friendships.addresseeId, addressee.id))
    .where(
      and(
        or(
          eq(friendships.requesterId, targetId),
          eq(friendships.addresseeId, targetId),
        ),
        eq(friendships.status, 'accepted'),
      ),
    )

  return result.map((f) =>
    f.requesterId === targetId ? f.addressee : f.requester,
  )
})
