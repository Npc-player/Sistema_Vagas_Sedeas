// src/db/schema/acolhimentos.ts
import { pgTable, uuid, text, date, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { regimeAcolhimentoEnum, motivoDesacolhimentoEnum, situacaoEspecialAcolhimentoEnum, } from './enums';

export const acolhimentos = pgTable('acolhimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  acolhidoId: uuid('acolhido_id').notNull(),
  unidadeId: uuid('unidade_id').notNull(),
  dataAcolhimento: date('data_acolhimento').notNull(),
  motivoAcolhimento: text('motivo_acolhimento').notNull(),
  motivoDetalhe: text('motivo_detalhe'),
  regime: regimeAcolhimentoEnum('regime').notNull(),

  // Dados processuais e territoriais
  numeroProcesso: text('numero_processo'),
  numeroMedidaProtetiva: text('numero_medida_protetiva'),
  numeroGuiaAcolhimento: text('numero_guia_acolhimento'),
  territorio: text('territorio'),

  // Equipe técnica (override da unidade, se preenchida)
  asVaraInfancia: text('as_vara_infancia'),
  psicVaraInfancia: text('psic_vara_infancia'),
  asCreas: text('as_creas'),
  psicCreas: text('psic_creas'),

  // Situação especial (evasão ou outros)
  situacaoEspecial: situacaoEspecialAcolhimentoEnum('situacao_especial'),
  situacaoOutrosDetalhe: text('situacao_outros_detalhe'),
  situacaoEspecialEm: date('situacao_especial_em'),

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
  numeroProcessoIdx: index('acolhimentos_numero_processo_idx').on(t.numeroProcesso),
  numeroGuiaIdx: index('acolhimentos_numero_guia_idx').on(t.numeroGuiaAcolhimento),
}));