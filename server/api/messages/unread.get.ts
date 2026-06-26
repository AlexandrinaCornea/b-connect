import { eq, and, or, ne } from "drizzle-orm";
import { db, conversations, messages } from "../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) return { count: 0 };

  const userId = (session.user as any).id;

  const userConvs = await db
    .select({
      id: conversations.id,
      user1Id: conversations.user1Id,
      user2Id: conversations.user2Id,
    })
    .from(conversations)
    .where(
      or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)),
    );

  if (!userConvs.length) return { count: 0 };

  let total = 0;
  for (const conv of userConvs) {
    const otherId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
    const unread = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conv.id),
          eq(messages.senderId, otherId),
          eq(messages.read, false),
        ),
      );
    total += unread.length;
  }

  return { count: total };
});
