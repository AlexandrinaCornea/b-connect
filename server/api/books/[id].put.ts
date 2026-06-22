import { eq } from "drizzle-orm";
import { db, books, favorites, notifications, users } from "../../db/index";
import { updateBookSchema } from "../../validations/book";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID lipsă" });

  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (!book)
    throw createError({ statusCode: 404, message: "Cartea nu există" });

  const sessionUserId = (session.user as any).id;
  const sessionRole = (session.user as any).role;

  if (book.ownerId !== sessionUserId && sessionRole !== "admin") {
    throw createError({ statusCode: 403, message: "Acces interzis" });
  }

  const body = await readBody(event);
  const result = updateBookSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    });
  }

  const wasAvailable = book.status === "available";
  const willBeAvailable = result.data.status === "available";

  const [updated] = await db
    .update(books)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(books.id, id))
    .returning();

  if (!wasAvailable && willBeAvailable) {
    const favUsers = await db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(eq(favorites.bookId, id));

    if (favUsers.length > 0) {
      await db.insert(notifications).values(
        favUsers
          .filter((f) => f.userId !== book.ownerId)
          .map((f) => ({
            userId: f.userId,
            type: "book_available" as const,
            message: `Cartea "${book.title}" pe care ai salvat-o la favorite este acum disponibilă!`,
            relatedId: id,
          })),
      );
    }
  }

  return updated;
});
