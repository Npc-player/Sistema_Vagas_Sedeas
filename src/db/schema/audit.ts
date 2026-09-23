import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  userEmail: text('user_email'),
  userRole: text('user_role'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  before: jsonb('before'),
  after: jsonb('after'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('audit_user_idx').on(t.userId),
  entityIdx: index('audit_entity_idx').on(t.entity, t.entityId),
  createdAtIdx: index('audit_created_idx').on(t.createdAt),
}));