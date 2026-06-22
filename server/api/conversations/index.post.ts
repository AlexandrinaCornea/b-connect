import { eq, or, and } from "drizzle-orm";
import { db, conversations, users } from "../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;
  const { otherUserId } = await readBody(event);

  if (!otherUserId)
    throw createError({ statusCode: 400, message: "otherUserId lipsă" });
  if (otherUserId === userId)
    throw createError({
      statusCode: 400,
      message: "Nu poți conversa cu tine însuți",
    });

  const [other] = await db
    .select()
    .from(users)
    .where(eq(users.id, otherUserId))
    .limit(1);
  if (!other)
    throw createError({ statusCode: 404, message: "Utilizatorul nu există" });

  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, otherUserId),
        ),
        and(
          eq(conversations.user1Id, otherUserId),
          eq(conversations.user2Id, userId),
        ),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [conv] = await db
    .insert(conversations)
    .values({ user1Id: userId, user2Id: otherUserId })
    .returning();

  return conv;
});
