import { eq, asc, or } from 'drizzle-orm'
import { db, conversations, messages, users } from '../../../db/index'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) throw createError({ statusCode: 401, message: 'Neautentificat' })

  const userId = (session.user as any).id
  const convId = getRouterParam(event, 'id')
  if (!convId) throw createError({ statusCode: 400, message: 'ID lipsă' })

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, convId))
    .limit(1)

  if (!conv) throw createError({ statusCode: 404, message: 'Conversație inexistentă' })
  if (conv.user1Id !== userId && conv.user2Id !== userId) {
    throw createError({ statusCode: 403, message: 'Acces interzis' })
  }

  const otherId = conv.user1Id === userId ? conv.user2Id : conv.user1Id
  await db
    .update(messages)
    .set({ read: true })
    .where(eq(messages.conversationId, convId))

  const result = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      read: messages.read,
      createdAt: messages.createdAt,
      sender: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt))

  return result
})
