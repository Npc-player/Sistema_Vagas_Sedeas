import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN_MUNICIPAL',
  'GESTOR_ACOLHIMENTO',
  'OPERADOR',
  'CONSELHO_MUNICIPAL',
  'JUDICIARIO_MP',
  'TI_SUPORTE',
]);

export const tipoAcolhimentoEnum = pgEnum('tipo_acolhimento', [
  'ILPI',
  'SAICA',
  'CENTRO_DIA_IDOSO',
  'JOSE_CALHERANI',
  'RESIDENCIA_INCLUSIVA',
]);

export const statusVagaEnum = pgEnum('status_vaga', [
  'DISPONIVEL',
  'OCUPADA',
  'BLOQUEADA',
  'RESERVADA',
]);

export const regimeAcolhimentoEnum = pgEnum('regime_acolhimento', [
  'PROVISORIO',
  'DEFINITIVO',
]);

export const motivoDesacolhimentoEnum = pgEnum('motivo_desacolhimento', [
  'REINTEGRACAO_FAMILIAR',
  'TRANSFERENCIA',
  'MAIORIDADE',
  'OBITO',
  'DECISAO_JUDICIAL',
]);
