// src/lib/validations/unidade.ts
// Validação de unidade com Zod — usada no client e no server.
// A dupla camada (client + server) é obrigatória: o client melhora a UX,
// o server garante a integridade mesmo se o client for contornado.

import { z } from 'zod';

const tiposAcolhimento = [
  'ILPI',
  'SAICA',
  'CENTRO_DIA_IDOSO',
  'JOSE_CALHERANI',
  'RESIDENCIA_INCLUSIVA',
  'CASA_PASSAGEM',
] as const;

// Regex de telefone: aceita (00) 0000-0000 ou (00) 00000-0000
const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

// Regex de CEP: aceita 00000-000 ou 00000000
const cepRegex = /^\d{5}-?\d{3}$/;

// Regex de CNPJ: aceita 00.000.000/0000-00 ou 14 dígitos
const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export const unidadeSchema = z.object({
  nome: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(200, 'O nome deve ter no máximo 200 caracteres'),

  tipo: z.enum(tiposAcolhimento, {
    message: 'Selecione um tipo de acolhimento válido',
  }),

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

  // Equipe técnica de referência (opcional)
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

export type UnidadeInput = z.infer<typeof unidadeSchema>;

// Schema específico para edição (inclui o ID)
export const editarUnidadeSchema = unidadeSchema.extend({
  id: z.string().uuid('ID inválido'),
});

export type EditarUnidadeInput = z.infer<typeof editarUnidadeSchema>;
