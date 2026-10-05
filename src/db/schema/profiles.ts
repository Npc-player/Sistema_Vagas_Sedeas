import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  nomeCompleto: text('nome_completo').notNull(),
  role: userRoleEnum('role').notNull(),
  unidadeId: uuid('unidade_id'),
  prontuario: text('prontuario'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});