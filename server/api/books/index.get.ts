import { eq, ilike, or, asc, desc, and, sql } from "drizzle-orm";
import { db, books, users } from "../../db/index";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search as string | undefined;
  const genre = query.genre as string | undefined;
  const status = query.status as "available" | "borrowed" | undefined;
  const ownerId = query.ownerId as string | undefined;
  const sortBy = (query.sortBy as string) ?? "createdAt";
  const order = (query.order as string) ?? "desc";

  const filters = [];

  if (search) {
    filters.push(
      or(
        ilike(books.title, `%${search}%`),
        ilike(books.author, `%${search}%`),
        ilike(books.genre, `%${search}%`),
      ),
    );
  }

  if (genre) {
    filters.push(ilike(books.genre, `%${genre}%`));
  }

  if (status) {
    filters.push(eq(books.status, status));
  }

  if (ownerId) {
    filters.push(eq(books.ownerId, ownerId));
  }

  const ratingExpr = sql<number>`CASE WHEN ${users.ratingCount} = 0 THEN 0 ELSE ${users.ratingSum}::float / ${users.ratingCount} END`;
  const sortColumn =
    sortBy === "title" ? books.title :
    sortBy === "rating" ? ratingExpr :
    books.createdAt;
  const sortDir = order === "asc" ? asc(sortColumn) : desc(sortColumn);

  const result = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      description: books.description,
      imageUrl: books.imageUrl,
      status: books.status,
      createdAt: books.createdAt,
      owner: {
        id: users.id,
        name: users.name,
        city: users.city,
        ratingSum: users.ratingSum,
        ratingCount: users.ratingCount,
      },
    })
    .from(books)
    .innerJoin(users, eq(books.ownerId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(sortDir);

  return result;
});
