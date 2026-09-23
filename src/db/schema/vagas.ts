import { pgTable, uuid, text, integer, date, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { statusVagaEnum } from './enums';

export const vagas = pgTable('vagas', {
  id: uuid('id').primaryKey().defaultRandom(),
  unidadeId: uuid('unidade_id').notNull(),
  numeroLeito: integer('numero_leito').notNull(),
  status: statusVagaEnum('status').notNull().default('DISPONIVEL'),
  motivoBloqueio: text('motivo_bloqueio'),
  prazoBloqueio: date('prazo_bloqueio'),
  reservadaParaAcolhidoId: uuid('reservada_para_acolhido_id'),
  reservadaAte: timestamp('reservada_ate', { withTimezone: true }),
  acolhimentoAtualId: uuid('acolhimento_atual_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unidadeNumeroIdx: uniqueIndex('vagas_unidade_numero_idx').on(t.unidadeId, t.numeroLeito),
  statusIdx: index('vagas_status_idx').on(t.status),
}));
