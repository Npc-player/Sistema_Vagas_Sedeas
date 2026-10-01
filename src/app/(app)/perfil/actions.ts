// src/app/(app)/perfil/actions.ts
'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { trocarSenhaSchema } from '@/lib/validations/perfil';
import { getSession } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';

export type PerfilActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// =====================================================
// Trocar senha
// =====================================================
export async function trocarSenhaAction(
  _prevState: PerfilActionState,
  formData: FormData
): Promise<PerfilActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  const raw = {
    senhaAtual: formData.get('senhaAtual'),
    novaSenha: formData.get('novaSenha'),
    confirmarSenha: formData.get('confirmarSenha'),
  };

  const parsed = trocarSenhaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, msgs] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      if (msgs && msgs.length > 0) fieldErrors[key] = msgs;
    }
    return { fieldErrors };
  }

  const { senhaAtual, novaSenha } = parsed.data;

  const supabase = await createClient();

  // 1. Verifica a senha atual fazendo um signIn (mais confiável que comparar hash)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Sessão inválida. Faça login novamente.' };
  }

  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });

  if (erroLogin) {
    // Auditoria de tentativa falha (não registra a senha)
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    await audit(
      {
        userId: session.userId,
        userEmail: session.userEmail,
        userRole: session.role,
        ipAddress: forwarded?.split(',')[0].trim() ?? null,
        userAgent: h.get('user-agent'),
      },
      {
        action: 'UPDATE',
        entity: 'profiles',
        entityId: session.userId,
        metadata: { operacao: 'TROCAR_SENHA', resultado: 'SENHA_ATUAL_INVALIDA' },
      }
    );
    return { error: 'Senha atual incorreta.' };
  }

  // 2. Atualiza a senha
  const { error: erroUpdate } = await supabase.auth.updateUser({
    password: novaSenha,
  });

  if (erroUpdate) {
    console.error('[trocarSenhaAction] erro ao atualizar:', erroUpdate);
    return {
      error: erroUpdate.message || 'Erro ao atualizar senha. Tente novamente.',
    };
  }

  // 3. Auditoria
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  await audit(
    {
      userId: session.userId,
      userEmail: session.userEmail,
      userRole: session.role,
      ipAddress: forwarded?.split(',')[0].trim() ?? null,
      userAgent: h.get('user-agent'),
    },
    {
      action: 'UPDATE',
      entity: 'profiles',
      entityId: session.userId,
      metadata: { operacao: 'TROCAR_SENHA', resultado: 'SUCESSO' },
    }
  );

  return { success: true };
}