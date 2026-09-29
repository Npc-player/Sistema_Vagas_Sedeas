// src/lib/rbac/index.ts
// Verificação de permissões (RBAC) centralizada.
//
// Padrão de uso:
//   const session = await requireSession();
//   if (!can.createUnidade(session.role)) throw new Error('Sem permissão');
//
// Ou, dentro de uma Server Action, use requirePermission() que já lança erro.

import { createClient } from '@/lib/supabase/server';

export type UserRole =
  | 'ADMIN_MUNICIPAL'
  | 'GESTOR_ACOLHIMENTO'
  | 'OPERADOR'
  | 'CONSELHO_MUNICIPAL'
  | 'JUDICIARIO_MP'
  | 'TI_SUPORTE';

export interface Session {
  userId: string;
  userEmail: string;
  role: UserRole;
  unidadeId: string | null;
}

// =====================================================
// Matriz de permissões
// =====================================================
// Cada função recebe a role e retorna true/false.
// Isso mantém as regras em UM lugar — quando mudar, muda aqui.
// =====================================================
export const can = {
  // -------------------- Unidades --------------------
  listarUnidades: (role: UserRole): boolean =>
    role === 'ADMIN_MUNICIPAL' ||
    role === 'CONSELHO_MUNICIPAL' ||
    role === 'JUDICIARIO_MP' ||
    role === 'GESTOR_ACOLHIMENTO' ||
    role === 'OPERADOR',

  criarUnidade: (role: UserRole): boolean => role === 'ADMIN_MUNICIPAL',

  editarUnidade: (role: UserRole): boolean => role === 'ADMIN_MUNICIPAL',

  desativarUnidade: (role: UserRole): boolean => role === 'ADMIN_MUNICIPAL',

  // -------------------- Vagas --------------------
  editarVagas: (role: UserRole): boolean =>
    role === 'ADMIN_MUNICIPAL' ||
    role === 'GESTOR_ACOLHIMENTO' ||
    role === 'OPERADOR',

  // -------------------- Acolhidos --------------------
  cadastrarAcolhido: (role: UserRole): boolean =>
    role === 'ADMIN_MUNICIPAL' ||
    role === 'GESTOR_ACOLHIMENTO' ||
    role === 'OPERADOR',

  // -------------------- Auditoria --------------------
  verAuditoria: (role: UserRole): boolean => role === 'ADMIN_MUNICIPAL',
};

// =====================================================
// Helpers de sessão
// =====================================================

/**
 * Retorna a sessão do usuário atual, ou null se não autenticado.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unidade_id, ativo')
    .eq('id', user.id)
    .maybeSingle();

  // Perfil inativo ou inexistente é tratado como "sem sessão"
  if (!profile || !profile.ativo) return null;

  return {
    userId: user.id,
    userEmail: user.email ?? '',
    role: profile.role as UserRole,
    unidadeId: profile.unidade_id,
  };
}

/**
 * Lança erro se não houver sessão. Usar dentro de Server Actions.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  return session;
}

/**
 * Lança erro se o usuário não tiver a permissão exigida.
 *
 * @param checkFuncao Função de verificação (ex.: can.criarUnidade)
 */
export async function requirePermission(
  checkFuncao: (role: UserRole) => boolean
): Promise<Session> {
  const session = await requireSession();
  if (!checkFuncao(session.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
