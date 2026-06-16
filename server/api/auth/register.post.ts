import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "../../db/index";
import { registerSchema } from "../../validations/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const result = registerSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message,
    });
  }

  const { name, email, password, city } = result.data;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Un cont cu acest email există deja",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      city: city ?? null,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      city: users.city,
      createdAt: users.createdAt,
    });

  return {
    success: true,
    user: newUser,
  };
});
