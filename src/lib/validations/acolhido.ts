// src/lib/validations/acolhido.ts
// Validação de acolhido com Zod.
// ⚠️ Os campos CPF, RG, alergias e comorbidades chegam em texto puro
// aqui — a criptografia acontece depois, na Server Action.

import { z } from 'zod';

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const rgRegex = /^[0-9A-Za-z.\-]{5,20}$/;

export const acolhidoSchema = z.object({
  // -------------------- Dados pessoais --------------------
  nomeCompleto: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo'),

  nomeSocial: z
    .string()
    .max(200, 'Nome social muito longo')
    .optional()
    .or(z.literal('')),

  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        return data <= hoje;
      },
      { message: 'A data de nascimento não pode ser no futuro' }
    )
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        const idadeAnos =
          (hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return idadeAnos <= 120;
      },
      { message: 'Data de nascimento improvável (mais de 120 anos)' }
    ),

  // -------------------- Filiação --------------------
  nomeMae: z
    .string()
    .min(3, 'Nome da mãe deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo')
    .optional()
    .or(z.literal('')),

  nomePai: z
    .string()
    .max(200, 'Nome muito longo')
    .optional()
    .or(z.literal('')),

  // -------------------- Documentos (serão criptografados) --------------------
  cpf: z
    .string()
    .regex(cpfRegex, 'CPF inválido (use 000.000.000-00 ou 11 dígitos)')
    .optional()
    .or(z.literal('')),

  rg: z
    .string()
    .regex(rgRegex, 'RG inválido (5 a 20 caracteres)')
    .optional()
    .or(z.literal('')),

  // -------------------- Saúde (será criptografada) --------------------
  alergias: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),

  comorbidades: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),

  // -------------------- Histórico familiar --------------------
  familiaHistorico: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type AcolhidoInput = z.infer<typeof acolhidoSchema>;

// Schema para edição (inclui o ID)
export const editarAcolhidoSchema = acolhidoSchema.extend({
  id: z.string().uuid('ID inválido'),
});

export type EditarAcolhidoInput = z.infer<typeof editarAcolhidoSchema>;

// =====================================================
// Helpers
// =====================================================

/**
 * Normaliza o CPF: remove formatação e retorna apenas os 11 dígitos.
 * Retorna string vazia se o CPF estiver vazio.
 */
export function normalizarCpf(cpf: string | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

/**
 * Calcula a idade em anos a partir de uma data de nascimento (YYYY-MM-DD).
 */
export function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}