// src/lib/validations/unidade.ts
import { z } from 'zod';

// =====================================================
// Tipos de serviço (Tipificação Nacional)
// =====================================================
export const tiposAcolhimento = [
  'ABRIGO_INSTITUCIONAL',
  'CASA_LAR',
  'CASA_PASSAGEM',
  'RESIDENCIA_INCLUSIVA',
  'REPUBLICA',
  'FAMILIA_ACOLHEDORA',
  'CALAMIDADES_EMERGENCIAS',
] as const;

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
// Público-alvo (checkboxes)
// =====================================================
export const publicosAlvo = [
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
] as const;

export const LABEL_PUBLICO_ALVO: Record<string, string> = {
  CRIANCAS_ADOLESCENTES: 'Crianças e Adolescentes',
  JOVENS_EGRESSOS: 'Jovens Egressos de Serviços de Acolhimento',
  CRIANCAS_ADOLESCENTES_DEFICIENCIA:
    'Exclusivamente Crianças e Adolescentes com Deficiência',
  ADULTOS_DEFICIENCIA: 'Exclusivamente para Adultos com Deficiência',
  ADULTOS_FAMILIAS: 'Adultos e Famílias',
  MULHERES_VIOLENCIA:
    'Mulheres em Situação de Violência Doméstica ou Familiar',
  PESSOAS_IDOSAS: 'Pessoas Idosas',
  POPULACAO_LGBTQIA: 'População LGBTQIA+',
  POPULACAO_RUA: 'População em Situação de Rua',
  SAIDA_RUA: 'População em Processo de Saída das Ruas',
  MIGRANTES_REFUGIADOS: 'Pessoas Migrantes e/ou Refugiadas',
  FAMILIAS_DESABRIGADAS:
    'Famílias Desabrigadas/Desalojadas Vítimas de Desastres',
};

// Regex de telefone, CEP e CNPJ
const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-?\d{3}$/;
const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export const unidadeSchema = z.object({
  nome: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(200, 'O nome deve ter no máximo 200 caracteres'),

  tipo: z.enum(tiposAcolhimento, {
    message: 'Selecione um tipo de serviço válido',
  }),

  publicoAlvo: z
    .array(z.enum(publicosAlvo))
    .min(1, 'Selecione pelo menos um público-alvo'),

  cnpj: z
    .string()
    .regex(cnpjRegex, 'CNPJ inválido (use 00.000.000/0000-00)')
    .optional()
    .or(z.literal('')),

  logradouro: z.string().min(3, 'Informe o logradouro'),
  numero: z.string().min(1, 'Informe o número'),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().min(2, 'Informe o bairro'),
  cidade: z.string().min(2, 'Informe a cidade'),
  uf: z
    .string()
    .length(2, 'UF deve ter 2 letras')
    .regex(/^[A-Z]{2}$/, 'UF deve ser maiúscula (ex.: SP)'),
  cep: z.string().regex(cepRegex, 'CEP inválido (use 00000-000)'),

  telefoneInstitucional: z
    .string()
    .regex(telefoneRegex, 'Telefone inválido (use (00) 0000-0000)'),

  emailInstitucional: z
    .string()
    .email('E-mail inválido')
    .max(200, 'E-mail muito longo'),

  capacidadeTotal: z
    .number({ message: 'Informe um número válido' })
    .int('Deve ser um número inteiro')
    .min(1, 'Deve ter pelo menos 1 vaga')
    .max(1000, 'Máximo de 1000 vagas'),

  responsavelNome: z
    .string()
    .min(3, 'Informe o nome do responsável')
    .max(200, 'Nome muito longo'),

  responsavelTelefone: z
    .string()
    .regex(telefoneRegex, 'Telefone inválido (use (00) 00000-0000)'),

  responsavelEmail: z.string().email('E-mail inválido').max(200),

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
});

export type UnidadeInput = z.infer<typeof unidadeSchema>;

export const editarUnidadeSchema = unidadeSchema.extend({
  id: z.string().uuid('ID inválido'),
});

export type EditarUnidadeInput = z.infer<typeof editarUnidadeSchema>;