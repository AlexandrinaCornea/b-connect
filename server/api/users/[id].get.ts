import { eq, sql } from "drizzle-orm";
import { db, users, books, loanRequests } from "../../db/index";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, message: "ID lipsă" });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      city: users.city,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      ratingSum: users.ratingSum,
      ratingCount: users.ratingCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw createError({ statusCode: 404, message: "Utilizatorul nu există" });
  }

  const [bookCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(books)
    .where(eq(books.ownerId, id));

  return {
    ...user,
    ratingAvg:
      user.ratingCount > 0
        ? Math.round((user.ratingSum / user.ratingCount) * 10) / 10
        : null,
    totalBooks: Number(bookCount.count),
  };
});
