import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

// Mapeia a tabela 'profiles' que já existe no Supabase.
// A FK aponta para auth.users (gerenciado pelo Supabase Auth).
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  nomeCompleto: text('nome_completo').notNull(),
  role: userRoleEnum('role').notNull(),
  unidadeId: uuid('unidade_id'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
