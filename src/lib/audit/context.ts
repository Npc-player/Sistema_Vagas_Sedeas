// src/lib/audit/context.ts
// Extrai o contexto (usuário, IP, user-agent) de uma requisição.
// Chamado sempre que uma operação auditável é executada.

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { AuditContext } from './types';

/**
 * Extrai o contexto de auditoria da requisição atual.
 *
 * - Usuário: lido da sessão Supabase (auth.getUser + profile)
 * - IP: lido do header x-forwarded-for (Vercel preenche automaticamente)
 * - User-Agent: lido do header user-agent
 *
 * Retorna contexto vazio (com nulls) se não houver sessão — útil para
 * registrar tentativas de login falhas.
 */
export async function getAuditContext(): Promise<AuditContext> {
  const headersList = await headers();

  // IP real do cliente (Vercel usa x-forwarded-for, com fallback para x-real-ip)
  const forwardedFor = headersList.get('x-forwarded-for');
  const ipAddress =
    forwardedFor?.split(',')[0].trim() ??
    headersList.get('x-real-ip') ??
    null;

  const userAgent = headersList.get('user-agent') ?? null;

  // Tenta ler a sessão atual
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      userEmail: null,
      userRole: null,
      ipAddress,
      userAgent,
    };
  }

  // Busca a role do profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    userRole: profile?.role ?? null,
    ipAddress,
    userAgent,
  };
}

/**
 * Contexto de auditoria para login falho (sem sessão válida).
 * Usado quando o usuário erra a senha — o userId ainda não existe.
 */
export async function getFailedLoginContext(
  email: string
): Promise<AuditContext> {
  const headersList = await headers();

  const forwardedFor = headersList.get('x-forwarded-for');
  const ipAddress =
    forwardedFor?.split(',')[0].trim() ??
    headersList.get('x-real-ip') ??
    null;

  const userAgent = headersList.get('user-agent') ?? null;

  return {
    userId: null,
    userEmail: email,
    userRole: null,
    ipAddress,
    userAgent,
  };
}