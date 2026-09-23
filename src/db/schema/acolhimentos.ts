import { pgTable, uuid, text, date, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { regimeAcolhimentoEnum, motivoDesacolhimentoEnum } from './enums';

export const acolhimentos = pgTable('acolhimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  acolhidoId: uuid('acolhido_id').notNull(),
  unidadeId: uuid('unidade_id').notNull(),
  dataAcolhimento: date('data_acolhimento').notNull(),
  motivoAcolhimento: text('motivo_acolhimento').notNull(),
  motivoDetalhe: text('motivo_detalhe'),
  regime: regimeAcolhimentoEnum('regime').notNull(),
  dataDesacolhimento: date('data_desacolhimento'),
  motivoDesacolhimento: motivoDesacolhimentoEnum('motivo_desacolhimento'),
  motivoDesacolhimentoDetalhe: text('motivo_desacolhimento_detalhe'),
  ativo: boolean('ativo').notNull().default(true),
  criadoPorUserId: uuid('criado_por_user_id').notNull(),
  protocolo: text('protocolo').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  acolhidoIdx: index('acolhimentos_acolhido_idx').on(t.acolhidoId),
  unidadeIdx: index('acolhimentos_unidade_idx').on(t.unidadeId),
  ativoIdx: index('acolhimentos_ativo_idx').on(t.ativo),
}));