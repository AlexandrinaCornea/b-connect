import { eq, or, desc, and } from "drizzle-orm";
import { db, conversations, users, messages } from "../../db/index";
import { getServerSession } from "#auth";
import { alias } from "drizzle-orm/pg-core";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;

  const user1 = alias(users, "user1");
  const user2 = alias(users, "user2");

  const result = await db
    .select({
      id: conversations.id,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      user1: {
        id: user1.id,
        name: user1.name,
        avatarUrl: user1.avatarUrl,
      },
      user2: {
        id: user2.id,
        name: user2.name,
        avatarUrl: user2.avatarUrl,
      },
    })
    .from(conversations)
    .innerJoin(user1, eq(conversations.user1Id, user1.id))
    .innerJoin(user2, eq(conversations.user2Id, user2.id))
    .where(
      or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)),
    )
    .orderBy(desc(conversations.updatedAt));

  const enriched = await Promise.all(
    result.map(async (conv) => {
      const [lastMsg] = await db
        .select({
          content: messages.content,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
        })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const unreadRows = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.read, false),
            eq(
              messages.senderId,
              conv.user1.id === userId ? conv.user2.id : conv.user1.id,
            ),
          ),
        );

      return {
        ...conv,
        lastMessage: lastMsg ?? null,
        unreadCount: unreadRows.length,
      };
    }),
  );

  return enriched;
});
