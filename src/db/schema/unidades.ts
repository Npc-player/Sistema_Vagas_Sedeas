import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { tipoAcolhimentoEnum } from './enums';

export const unidades = pgTable('unidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  tipo: tipoAcolhimentoEnum('tipo').notNull(),
  cnpj: text('cnpj'),
  logradouro: text('logradouro').notNull(),
  numero: text('numero').notNull(),
  complemento: text('complemento'),
  bairro: text('bairro').notNull(),
  cidade: text('cidade').notNull(),
  uf: text('uf').notNull(),
  cep: text('cep').notNull(),
  telefoneInstitucional: text('telefone_institucional').notNull(),
  emailInstitucional: text('email_institucional').notNull(),
  capacidadeTotal: integer('capacidade_total').notNull(),
  responsavelNome: text('responsavel_nome').notNull(),
  responsavelTelefone: text('responsavel_telefone').notNull(),
  responsavelEmail: text('responsavel_email').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tipoIdx: index('unidades_tipo_idx').on(t.tipo),
  ativoIdx: index('unidades_ativo_idx').on(t.ativo),
}));
