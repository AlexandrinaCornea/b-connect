import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Titlul este obligatoriu'),
  author: z.string().min(1, 'Autorul este obligatoriu'),
  genre: z.string().min(1, 'Genul este obligatoriu'),
  imageUrl: z.string().min(1, 'Imaginea este obligatorie'),
  description: z.string().min(1, 'Descrierea este obligatorie'),
  pageCount: z.number().int().positive('Numărul de pagini este obligatoriu'),
  publishedYear: z.number().int().min(1000).max(2099),
})

export const updateBookSchema = createBookSchema.partial().extend({
  status: z.enum(['available', 'borrowed']).optional(),
})

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
