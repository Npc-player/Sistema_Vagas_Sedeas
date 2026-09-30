// src/lib/validations/vaga.ts
// Validações do módulo de vagas.

import { z } from 'zod';

export const motivosBloqueio = [
  'MANUTENCAO',
  'REFORMA',
  'INTERDICAO_SANITARIA',
  'DESINFECCAO_ISOLAMENTO',
  'OBRA_ESTRUTURAL',
  'OUTRO',
] as const;

export const LABEL_MOTIVO_BLOQUEIO: Record<string, string> = {
  MANUTENCAO: 'Manutenção',
  REFORMA: 'Reforma',
  INTERDICAO_SANITARIA: 'Interdição sanitária',
  DESINFECCAO_ISOLAMENTO: 'Desinfecção / Isolamento',
  OBRA_ESTRUTURAL: 'Obra estrutural',
  OUTRO: 'Outro',
};

export const bloquearVagaSchema = z.object({
  vagaId: z.string().uuid('ID da vaga inválido'),

  motivo: z.enum(motivosBloqueio, {
    message: 'Selecione um motivo de bloqueio',
  }),

  motivoDetalhe: z
    .string()
    .max(500, 'Máximo de 500 caracteres')
    .optional()
    .or(z.literal('')),

  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .refine(
      (val) => {
        const data = new Date(val + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return data >= hoje;
      },
      { message: 'O prazo deve ser hoje ou uma data futura' }
    ),
});

export type BloquearVagaInput = z.infer<typeof bloquearVagaSchema>;