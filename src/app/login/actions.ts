// src/app/login/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/audit/log';
import { getAuditContext, getFailedLoginContext } from '@/lib/audit/context';

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/dashboard');

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Auditoria de login falho — sem sessão ativa, montamos contexto mínimo
    const context = await getFailedLoginContext(email);
    await audit(context, {
      action: 'LOGIN_FAILED',
      entity: 'profiles',
      metadata: {
        reason: error.message,
        // NUNCA logar a senha, mesmo em log de falha
      },
    });

    // Mensagem genérica para não revelar se o e-mail existe (segurança)
    return { error: 'Credenciais inválidas.' };
  }

  // Login bem-sucedido — agora há sessão, extraímos o contexto completo
  const context = await getAuditContext();
  await audit(context, {
    action: 'LOGIN',
    entity: 'profiles',
    entityId: context.userId,
  });

  // Valida o destino do redirect contra open redirect
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';

  redirect(safeRedirect);
}

export async function logoutAction(): Promise<void> {
  // Captura o contexto ANTES de destruir a sessão,
  // senão perdemos o userId/role para o log.
  const context = await getAuditContext();

  const supabase = await createClient();
  await supabase.auth.signOut();

  await audit(context, {
    action: 'LOGOUT',
    entity: 'profiles',
    entityId: context.userId,
  });

  redirect('/login');
}