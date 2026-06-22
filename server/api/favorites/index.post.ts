import { eq, and } from "drizzle-orm";
import { db, favorites, books } from "../../db/index";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session)
    throw createError({ statusCode: 401, message: "Neautentificat" });

  const userId = (session.user as any).id;
  const { bookId } = await readBody(event);

  if (!bookId) throw createError({ statusCode: 400, message: "bookId lipsă" });

  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);
  if (!book)
    throw createError({ statusCode: 404, message: "Cartea nu există" });

  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)))
    .limit(1);

  if (existing) return existing;

  const [fav] = await db
    .insert(favorites)
    .values({ userId, bookId })
    .returning();

  return fav;
});
