import { eq } from "drizzle-orm";
import { db, books } from "../../db/index";
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
  if (book.ownerId !== (session.user as any).id) {
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

  const [updated] = await db
    .update(books)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(books.id, id))
    .returning();

  return updated;
});
