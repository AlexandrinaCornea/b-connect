import { db, books } from '../../db/index'
import { createBookSchema } from '../../validations/book'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Neautentificat' })
  }

  const body = await readBody(event)
  const result = createBookSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.errors[0].message })
  }

  const [newBook] = await db
    .insert(books)
    .values({
      ...result.data,
      ownerId: (session.user as any).id,
    })
    .returning()

  return newBook
})
