// src/lib/validations/acolhimento.ts
// Validação da admissão + regras de negócio (RN-01, RN-02, RN-03).

import { z } from 'zod';

export const regimesAcolhimento = ['PROVISORIO', 'DEFINITIVO'] as const;

export const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

export const motivosAcolhimento = [
  'VULNERABILIDADE_SOCIAL',
  'NEGLIGENCIA_FAMILIAR',
  'VIOLENCIA_DOMESTICA',
  'ABANDONO',
  'DEPENDENCIA_QUIMICA',
  'SAUDE_MENTAL',
  'SITUACAO_RUA',
  'DETERMINACAO_JUDICIAL',
  'OUTRO',
] as const;

export const LABEL_MOTIVO_ACOLHIMENTO: Record<string, string> = {
  VULNERABILIDADE_SOCIAL: 'Vulnerabilidade social',
  NEGLIGENCIA_FAMILIAR: 'Negligência familiar',
  VIOLENCIA_DOMESTICA: 'Violência doméstica',
  ABANDONO: 'Abandono',
  DEPENDENCIA_QUIMICA: 'Dependência química',
  SAUDE_MENTAL: 'Saúde mental',
  SITUACAO_RUA: 'Situação de rua',
  DETERMINACAO_JUDICIAL: 'Determinação judicial',
  OUTRO: 'Outro',
};

export const admitirSchema = z.object({
  acolhidoId: z.string().uuid('Selecione uma pessoa acolhida'),

  unidadeId: z.string().uuid('Selecione uma unidade'),

  vagaId: z.string().uuid('Selecione uma vaga disponível'),

  dataAcolhimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        return data <= hoje;
      },
      { message: 'A data não pode ser no futuro' }
    ),

  motivo: z.enum(motivosAcolhimento, {
    message: 'Selecione o motivo do acolhimento',
  }),

  motivoDetalhe: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),

  regime: z.enum(regimesAcolhimento, {
    message: 'Selecione o regime',
  }),

  // Dados processuais (opcionais)
  numeroProcesso: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  numeroMedidaProtetiva: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  numeroGuiaAcolhimento: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  territorio: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  asVaraInfancia: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  psicVaraInfancia: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  asCreas: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),
  psicCreas: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),
});

export type AdmitirInput = z.infer<typeof admitirSchema>;

// =====================================================
// RN-01 — Compatibilidade de tipologia
// =====================================================
// Regras conforme documento técnico:
//   - SAICA: exclusivamente crianças e adolescentes (0 a 17 anos)
//   - ILPI: idosos (60+ anos) em situação de dependência
//   - Centro Dia Idoso: idosos (60+) — semi-aberto, mas mesmo perfil
//   - SAI — Serviço de Acolhimento Institucional: idosos (60+)
//   - Residência Inclusiva: adultos (18+) com deficiência
// =====================================================

// =====================================================
// RN-01 — Compatibilidade por TIPO DE SERVIÇO
// =====================================================
// A idade mínima/máxima é uma verificação prévia. A validação
// definitiva considera o PÚBLICO-ALVO da unidade (ver abaixo).
// =====================================================
export const IDADE_MINIMA_POR_TIPO: Record<string, number> = {
  ABRIGO_INSTITUCIONAL: 0,
  CASA_LAR: 0,
  CASA_PASSAGEM: 0,
  RESIDENCIA_INCLUSIVA: 18,
  REPUBLICA: 18,
  FAMILIA_ACOLHEDORA: 0,
  CALAMIDADES_EMERGENCIAS: 0,
};

export const IDADE_MAXIMA_POR_TIPO: Record<string, number> = {
  ABRIGO_INSTITUCIONAL: 120,
  CASA_LAR: 120,
  CASA_PASSAGEM: 120,
  RESIDENCIA_INCLUSIVA: 120,
  REPUBLICA: 120,
  FAMILIA_ACOLHEDORA: 17,
  CALAMIDADES_EMERGENCIAS: 120,
};

// =====================================================
// RN-01 — Compatibilidade por PÚBLICO-ALVO (mais preciso)
// =====================================================
export const IDADE_MINIMA_POR_PUBLICO: Record<string, number> = {
  CRIANCAS_ADOLESCENTES: 0,
  JOVENS_EGRESSOS: 18,
  CRIANCAS_ADOLESCENTES_DEFICIENCIA: 0,
  ADULTOS_DEFICIENCIA: 18,
  ADULTOS_FAMILIAS: 18,
  MULHERES_VIOLENCIA: 18,
  PESSOAS_IDOSAS: 60,
  POPULACAO_LGBTQIA: 18,
  POPULACAO_RUA: 18,
  SAIDA_RUA: 18,
  MIGRANTES_REFUGIADOS: 0,
  FAMILIAS_DESABRIGADAS: 0,
};

export const IDADE_MAXIMA_POR_PUBLICO: Record<string, number> = {
  CRIANCAS_ADOLESCENTES: 17,
  JOVENS_EGRESSOS: 21,
  CRIANCAS_ADOLESCENTES_DEFICIENCIA: 17,
  ADULTOS_DEFICIENCIA: 120,
  ADULTOS_FAMILIAS: 120,
  MULHERES_VIOLENCIA: 120,
  PESSOAS_IDOSAS: 120,
  POPULACAO_LGBTQIA: 120,
  POPULACAO_RUA: 120,
  SAIDA_RUA: 120,
  MIGRANTES_REFUGIADOS: 120,
  FAMILIAS_DESABRIGADAS: 120,
};

export interface ResultadoCompatibilidade {
  compativel: boolean;
  motivo?: string;
}

/**
 * Verifica se um acolhido de determinada idade pode ser admitido em
 * uma unidade de determinado tipo (RN-01).
 */
export function verificarCompatibilidade(
  idadeAnos: number,
  tipoUnidade: string
): ResultadoCompatibilidade {
  const min = IDADE_MINIMA_POR_TIPO[tipoUnidade];
  const max = IDADE_MAXIMA_POR_TIPO[tipoUnidade];

  if (min === undefined || max === undefined) {
    return {
      compativel: false,
      motivo: `Tipo de serviço desconhecido: ${tipoUnidade}`,
    };
  }

  if (idadeAnos < min) {
    return {
      compativel: false,
      motivo: `Este tipo de serviço atende pessoas a partir de ${min} anos. A pessoa tem ${idadeAnos} anos.`,
    };
  }

  if (idadeAnos > max) {
    return {
      compativel: false,
      motivo: `Este tipo de serviço atende pessoas até ${max} anos. A pessoa tem ${idadeAnos} anos.`,
    };
  }

  return { compativel: true };
}

/**
 * RN-01 (versão expandida): valida a compatibilidade considerando
 * o tipo do serviço E o público-alvo da unidade.
 * Retorna compatível se a idade bater com PELO MENOS UM dos públicos.
 */
export function verificarCompatibilidadePorPublico(
  idadeAnos: number,
  tipoUnidade: string,
  publicosAlvo: string[]
): ResultadoCompatibilidade {
  // Primeiro valida o tipo de serviço
  const porTipo = verificarCompatibilidade(idadeAnos, tipoUnidade);
  if (!porTipo.compativel) return porTipo;

  // Se não houver públicos cadastrados, aceita (fallback)
  if (!publicosAlvo || publicosAlvo.length === 0) {
    return { compativel: true };
  }

  // Verifica se a idade bate com pelo menos um dos públicos
  for (const publico of publicosAlvo) {
    const min = IDADE_MINIMA_POR_PUBLICO[publico];
    const max = IDADE_MAXIMA_POR_PUBLICO[publico];
    if (min === undefined || max === undefined) continue;
    if (idadeAnos >= min && idadeAnos <= max) {
      return { compativel: true };
    }
  }

  return {
    compativel: false,
    motivo:
      'A idade da pessoa não corresponde a nenhum dos públicos-alvo atendidos por esta unidade.',
  };
}

export const LABEL_TIPO_ACOLHIMENTO: Record<string, string> = {
  ABRIGO_INSTITUCIONAL: 'Abrigo Institucional',
  CASA_LAR: 'Casa Lar',
  CASA_PASSAGEM: 'Casa de Passagem',
  RESIDENCIA_INCLUSIVA: 'Residência Inclusiva',
  REPUBLICA: 'República',
  FAMILIA_ACOLHEDORA: 'Família Acolhedora',
  CALAMIDADES_EMERGENCIAS:
    'Proteção em Calamidades Públicas e Emergências',
};

// =====================================================
// Desacolhimento
// =====================================================

export const motivosDesacolhimento = [
  'REINTEGRACAO_FAMILIAR',
  'TRANSFERENCIA',
  'MAIORIDADE',
  'OBITO',
  'DECISAO_JUDICIAL',
] as const;

export const LABEL_MOTIVO_DESACOLHIMENTO: Record<string, string> = {
  REINTEGRACAO_FAMILIAR: 'Reintegração familiar',
  TRANSFERENCIA: 'Transferência para outra unidade',
  MAIORIDADE: 'Maioridade (18 anos)',
  OBITO: 'Óbito',
  DECISAO_JUDICIAL: 'Decisão judicial',
};

export const desacolherSchema = z.object({
  acolhimentoId: z.string().uuid('ID inválido'),

  dataDesacolhimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        return data <= hoje;
      },
      { message: 'A data não pode ser no futuro' }
    ),

  motivoDesacolhimento: z.enum(motivosDesacolhimento, {
    message: 'Selecione o motivo do desacolhimento',
  }),

  motivoDesacolhimentoDetalhe: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type DesacolherInput = z.infer<typeof desacolherSchema>;

// =====================================================
// Edição de acolhimento
// =====================================================
export const editarAcolhimentoSchema = z.object({
  id: z.string().uuid('ID inválido'),

  dataAcolhimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        return data <= hoje;
      },
      { message: 'A data não pode ser no futuro' }
    ),

  motivo: z.enum(motivosAcolhimento, {
    message: 'Selecione o motivo do acolhimento',
  }),

  motivoDetalhe: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),

  regime: z.enum(regimesAcolhimento, {
    message: 'Selecione o regime',
  }),

  numeroProcesso: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  numeroMedidaProtetiva: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  numeroGuiaAcolhimento: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),

  territorio: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  asVaraInfancia: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  psicVaraInfancia: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),

  asCreas: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),
  psicCreas: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),
});

export type EditarAcolhimentoInput = z.infer<typeof editarAcolhimentoSchema>;

// =====================================================
// Situação especial (evasão / outros)
// =====================================================
export const situacoesEspeciais = ['EVASAO', 'OUTROS'] as const;

export const LABEL_SITUACAO_ESPECIAL: Record<string, string> = {
  EVASAO: 'Evasão (acolhido fugiu da unidade)',
  OUTROS: 'Outros (família extensa/substituta aguardando decisão judicial)',
};

export const registrarSituacaoEspecialSchema = z
  .object({
    acolhimentoId: z.string().uuid('ID inválido'),

    situacaoEspecial: z.enum(situacoesEspeciais, {
      message: 'Selecione a situação',
    }),

    situacaoOutrosDetalhe: z
      .string()
      .max(2000, 'Máximo de 2000 caracteres')
      .optional()
      .or(z.literal('')),

    situacaoEspecialEm: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
      .refine(
        (val) => {
          const data = new Date(val + 'T00:00:00');
          const hoje = new Date();
          hoje.setHours(23, 59, 59, 999);
          return data <= hoje;
        },
        { message: 'A data não pode ser no futuro' }
      ),
  })
  .refine(
    (data) =>
      data.situacaoEspecial !== 'OUTROS' ||
      (data.situacaoOutrosDetalhe &&
        data.situacaoOutrosDetalhe.trim().length >= 20),
    {
      message:
        'Para a situação "Outros", descreva o caso com pelo menos 20 caracteres',
      path: ['situacaoOutrosDetalhe'],
    }
  );

export type RegistrarSituacaoEspecialInput = z.infer<
  typeof registrarSituacaoEspecialSchema
>;