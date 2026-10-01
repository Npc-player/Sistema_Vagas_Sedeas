// src/lib/validations/perfil.ts
// Validações do perfil do próprio usuário.

import { z } from 'zod';

const senhaForteRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe sua senha atual'),

    novaSenha: z
      .string()
      .min(12, 'A nova senha deve ter pelo menos 12 caracteres')
      .max(128, 'Senha muito longa')
      .regex(
        senhaForteRegex,
        'A senha deve conter: letra maiúscula, minúscula, número e caractere especial'
      ),

    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
  .refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  });

export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;