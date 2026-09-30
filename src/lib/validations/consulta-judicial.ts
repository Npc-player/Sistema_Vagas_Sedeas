// src/lib/validations/consulta-judicial.ts
// Validação da consulta judicial (Judiciário / MP).

import { z } from 'zod';

export const tiposBusca = ['CPF', 'NOME', 'PROTOCOLO'] as const;

export const LABEL_TIPO_BUSCA: Record<string, string> = {
  CPF: 'CPF do acolhido',
  NOME: 'Nome completo',
  PROTOCOLO: 'Protocolo de acolhimento',
};

export const consultaJudicialSchema = z
  .object({
    tipo: z.enum(tiposBusca, { message: 'Selecione o tipo de busca' }),

    termo: z
      .string()
      .min(3, 'Informe pelo menos 3 caracteres')
      .max(200, 'Termo muito longo'),

    justificativa: z
      .string()
      .min(50, 'A justificativa deve ter pelo menos 50 caracteres')
      .max(2000, 'Justificativa muito longa (máximo 2000 caracteres)'),

    // Número do processo judicial ou ofício (opcional, mas recomendado)
    processoJudicial: z
      .string()
      .max(50, 'Máximo de 50 caracteres')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.tipo === 'CPF') {
        const limpo = data.termo.replace(/\D/g, '');
        return limpo.length === 11;
      }
      return true;
    },
    {
      message: 'CPF deve ter 11 dígitos',
      path: ['termo'],
    }
  );

export type ConsultaJudicialInput = z.infer<typeof consultaJudicialSchema>;