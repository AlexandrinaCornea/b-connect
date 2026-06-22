import { eq, or, and } from "drizzle-orm";
import { db, friendships, notifications, users } from "../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;
  const { addresseeId } = await readBody(event);

  if (!addresseeId)
    throw createError({ statusCode: 400, message: "addresseeId lipsă" });
  if (addresseeId === userId)
    throw createError({
      statusCode: 400,
      message: "Nu poți fi prieten cu tine însuți",
    });

  const [other] = await db
    .select()
    .from(users)
    .where(eq(users.id, addresseeId))
    .limit(1);
  if (!other)
    throw createError({ statusCode: 404, message: "Utilizatorul nu există" });

  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, addresseeId),
        ),
        and(
          eq(friendships.requesterId, addresseeId),
          eq(friendships.addresseeId, userId),
        ),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [friendship] = await db
    .insert(friendships)
    .values({ requesterId: userId, addresseeId })
    .returning();

  const requesterName = (session.user as any).name ?? "Cineva";
  await db.insert(notifications).values({
    userId: addresseeId,
    type: "friend_request",
    message: `${requesterName} ți-a trimis o cerere de prietenie.`,
    relatedId: friendship.id,
  });

  return friendship;
});
