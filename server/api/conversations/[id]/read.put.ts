import { eq, and, ne } from "drizzle-orm";
import { db, conversations, messages } from "../../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;
  const convId = getRouterParam(event, "id");
  if (!convId) throw createError({ statusCode: 400, message: "ID lipsă" });

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, convId))
    .limit(1);

  if (!conv)
    throw createError({ statusCode: 404, message: "Conversație inexistentă" });
  if (conv.user1Id !== userId && conv.user2Id !== userId) {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  await db
    .update(messages)
    .set({ read: true, readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, convId),
        ne(messages.senderId, userId),
        eq(messages.read, false),
      ),
    );

  return { ok: true };
});
