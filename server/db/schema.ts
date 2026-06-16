import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const bookStatusEnum = pgEnum('book_status', [
  'available',   // disponibilă pentru împrumut
  'borrowed',    // în prezent împrumutată
])

export const loanStatusEnum = pgEnum('loan_status', [
  'pending',    // cerere trimisă, în așteptare
  'active',     // cerere acceptată, carte împrumutată
  'returned',   // carte returnată
  'rejected',   // cerere respinsă de proprietar
  'cancelled',  // cerere anulată de solicitant
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'loan_request',     // ai primit o cerere de împrumut
  'loan_accepted',    // cererea ta a fost acceptată
  'loan_rejected',    // cererea ta a fost respinsă
  'loan_returned',    // cartea a fost marcată returnată
  'due_date_reminder',// termenul de returnare se apropie
  'new_review',       // ai primit un review
])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),         // hash bcrypt
  city: text('city'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  ratingSum: integer('rating_sum').default(0).notNull(),
  ratingCount: integer('rating_count').default(0).notNull(),
  // ratingAvg calculat la query: ratingSum / ratingCount
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Books ────────────────────────────────────────────────────────────────────

export const books = pgTable('books', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre'),
  description: text('description'),
  imageUrl: text('image_url'),
  status: bookStatusEnum('status').default('available').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Loan Requests ────────────────────────────────────────────────────────────

export const loanRequests = pgTable('loan_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  borrowerId: text('borrower_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: loanStatusEnum('status').default('pending').notNull(),
  message: text('message'),               // mesaj opțional de la solicitant
  dueDate: timestamp('due_date'),         // termen de returnare agreat
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'), // când a acceptat/respins proprietarul
  returnedAt: timestamp('returned_at'),   // când a fost marcată returnată
})

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id')
    .notNull()
    .references(() => loanRequests.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reviewedUserId: text('reviewed_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),    // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  relatedId: text('related_id'),          // id loan/book/review asociat
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert

export type LoanRequest = typeof loanRequests.$inferSelect
export type NewLoanRequest = typeof loanRequests.$inferInsert

export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
