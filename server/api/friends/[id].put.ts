import { eq } from "drizzle-orm";
import { db, friendships, notifications, users } from "../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID lipsă" });

  const { status } = await readBody<{ status: "accepted" | "rejected" }>(event);
  if (!["accepted", "rejected"].includes(status)) {
    throw createError({ statusCode: 400, message: "Status invalid" });
  }

  const [fs] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, id))
    .limit(1);
  if (!fs)
    throw createError({ statusCode: 404, message: "Cerere inexistentă" });
  if (fs.addresseeId !== userId)
    throw createError({ statusCode: 403, message: "Acces interzis" });

  const [updated] = await db
    .update(friendships)
    .set({ status, updatedAt: new Date() })
    .where(eq(friendships.id, id))
    .returning();

  if (status === "accepted") {
    const acceptorName = (session.user as any).name ?? "Cineva";
    await db.insert(notifications).values({
      userId: fs.requesterId,
      type: "friend_accepted",
      message: `${acceptorName} ți-a acceptat cererea de prietenie.`,
      relatedId: id,
    });
  }

  return updated;
});
