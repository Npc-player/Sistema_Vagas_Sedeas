// src/lib/validations/usuario.ts
// Validações do módulo de administração de usuários.

import { z } from 'zod';

export const rolesUsuario = [
  'ADMIN_MUNICIPAL',
  'GESTOR_ACOLHIMENTO',
  'OPERADOR',
  'CONSELHO_MUNICIPAL',
  'JUDICIARIO_MP',
  'TI_SUPORTE',
] as const;

export const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

// Roles que exigem unidade vinculada
export const ROLES_COM_UNIDADE = ['GESTOR_ACOLHIMENTO', 'OPERADOR'];

// Roles que exigem 2FA (o sistema ainda não implementou TOTP para o usuário,
// mas deixamos o campo para futuro)
export const ROLES_COM_2FA_OBRIGATORIO = ['ADMIN_MUNICIPAL', 'JUDICIARIO_MP'];

export const criarUsuarioSchema = z
  .object({
    email: z.string().email('E-mail inválido').max(200),
    nomeCompleto: z
      .string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(200),
    role: z.enum(rolesUsuario, { message: 'Selecione um perfil' }),
    unidadeId: z
      .string()
      .uuid('Unidade inválida')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) =>
      !ROLES_COM_UNIDADE.includes(data.role) || (data.unidadeId && data.unidadeId !== ''),
    {
      message: 'Este perfil exige uma unidade vinculada',
      path: ['unidadeId'],
    }
  );

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const editarUsuarioSchema = z
  .object({
    id: z.string().uuid('ID inválido'),
    nomeCompleto: z
      .string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(200),
    role: z.enum(rolesUsuario, { message: 'Selecione um perfil' }),
    unidadeId: z
      .string()
      .uuid('Unidade inválida')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) =>
      !ROLES_COM_UNIDADE.includes(data.role) || (data.unidadeId && data.unidadeId !== ''),
    {
      message: 'Este perfil exige uma unidade vinculada',
      path: ['unidadeId'],
    }
  );

export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;