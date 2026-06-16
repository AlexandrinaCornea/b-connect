import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// useRuntimeConfig() nu e disponibil în afara contextului Nuxt,
// deci citim direct din process.env pentru inițializarea conexiunii.
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })

export * from './schema'
