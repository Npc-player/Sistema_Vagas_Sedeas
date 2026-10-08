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
  'ABRIGO_INSTITUCIONAL',
  'CASA_LAR',
  'CASA_PASSAGEM',
  'RESIDENCIA_INCLUSIVA',
  'REPUBLICA',
  'FAMILIA_ACOLHEDORA',
  'CALAMIDADES_EMERGENCIAS',
]);

export const publicoAlvoEnum = pgEnum('publico_alvo', [
  'CRIANCAS_ADOLESCENTES',
  'JOVENS_EGRESSOS',
  'CRIANCAS_ADOLESCENTES_DEFICIENCIA',
  'ADULTOS_DEFICIENCIA',
  'ADULTOS_FAMILIAS',
  'MULHERES_VIOLENCIA',
  'PESSOAS_IDOSAS',
  'POPULACAO_LGBTQIA',
  'POPULACAO_RUA',
  'SAIDA_RUA',
  'MIGRANTES_REFUGIADOS',
  'FAMILIAS_DESABRIGADAS',
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
  'EVASAO',
]);

export const situacaoEspecialAcolhimentoEnum = pgEnum(
  'situacao_especial_acolhimento',
  ['EVASAO', 'OUTROS']
);