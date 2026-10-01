// src/lib/validations/dpo.ts
// Validações do módulo DPO (LGPD Art. 41).

import { z } from 'zod';

// =====================================================
// Configuração do DPO (Encarregado)
// =====================================================
export const configuracaoDpoSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200),
  email: z.string().email('E-mail inválido').max(200),
  telefone: z
    .string()
    .max(30, 'Telefone muito longo')
    .optional()
    .or(z.literal('')),
  cargo: z
    .string()
    .max(200, 'Cargo muito longo')
    .optional()
    .or(z.literal('')),
  endereco: z
    .string()
    .max(500, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),
  horarioAtendimento: z
    .string()
    .max(200, 'Máximo de 200 caracteres')
    .optional()
    .or(z.literal('')),
  observacoes: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type ConfiguracaoDpoInput = z.infer<typeof configuracaoDpoSchema>;

// =====================================================
// Requisição LGPD
// =====================================================
export const tiposRequisicaoLgpd = [
  'ACESSO',
  'CORRECAO',
  'EXCLUSAO',
  'PORTABILIDADE',
  'INFORMACAO_COMPARTILHAMENTO',
  'REVOGACAO_CONSENTIMENTO',
  'OUTRO',
] as const;

export const LABEL_TIPO_REQUISICAO: Record<string, string> = {
  ACESSO: 'Acesso aos dados',
  CORRECAO: 'Correção de dados',
  EXCLUSAO: 'Exclusão de dados',
  PORTABILIDADE: 'Portabilidade dos dados',
  INFORMACAO_COMPARTILHAMENTO: 'Informação sobre compartilhamento',
  REVOGACAO_CONSENTIMENTO: 'Revogação de consentimento',
  OUTRO: 'Outro',
};

export const statusRequisicaoLgpd = [
  'RECEBIDA',
  'EM_ANALISE',
  'RESPONDIDA',
  'ARQUIVADA',
] as const;

export const LABEL_STATUS_REQUISICAO: Record<string, string> = {
  RECEBIDA: 'Recebida',
  EM_ANALISE: 'Em análise',
  RESPONDIDA: 'Respondida',
  ARQUIVADA: 'Arquivada',
};

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export const criarRequisicaoLgpdSchema = z.object({
  tipo: z.enum(tiposRequisicaoLgpd, {
    message: 'Selecione o tipo de requisição',
  }),
  requerenteNome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200),
  requerenteEmail: z.string().email('E-mail inválido').max(200),
  requerenteTelefone: z
    .string()
    .max(30, 'Telefone muito longo')
    .optional()
    .or(z.literal('')),
  requerenteCpf: z
    .string()
    .regex(cpfRegex, 'CPF inválido (use 000.000.000-00)')
    .optional()
    .or(z.literal('')),
  descricao: z
    .string()
    .min(50, 'A descrição deve ter pelo menos 50 caracteres')
    .max(4000, 'Descrição muito longa (máximo 4000 caracteres)'),
});

export type CriarRequisicaoLgpdInput = z.infer<
  typeof criarRequisicaoLgpdSchema
>;

// =====================================================
// Resposta à requisição
// =====================================================
export const responderRequisicaoLgpdSchema = z.object({
  requisicaoId: z.string().uuid('ID inválido'),
  resposta: z
    .string()
    .min(20, 'A resposta deve ter pelo menos 20 caracteres')
    .max(4000, 'Resposta muito longa (máximo 4000 caracteres)'),
  novoStatus: z.enum(['EM_ANALISE', 'RESPONDIDA', 'ARQUIVADA'], {
    message: 'Status inválido',
  }),
});

export type ResponderRequisicaoLgpdInput = z.infer<
  typeof responderRequisicaoLgpdSchema
>;

// =====================================================
// Helper — normaliza CPF
// =====================================================
export function normalizarCpf(cpf: string | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}