// src/app/(app)/usuarios/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  criarUsuarioSchema,
  editarUsuarioSchema,
} from '@/lib/validations/usuario';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type UsuarioActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  senhaTemporaria?: string; // retornada apenas na criação (uma vez)
};

async function buildContext(session: Session): Promise<AuditContext> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return {
    userId: session.userId,
    userEmail: session.userEmail,
    userRole: session.role,
    ipAddress: forwarded?.split(',')[0].trim() ?? null,
    userAgent: h.get('user-agent'),
  };
}

// Gera senha temporária forte (16 caracteres)
function gerarSenhaTemporaria(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let senha = '';
  for (let i = 0; i < 16; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Garante pelo menos 1 de cada classe
  return (
    senha.slice(0, 12) +
    ['A', 'a', '1', '!'][Math.floor(Math.random() * 4)] +
    Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0')
  );
}

// =====================================================
// CRIAR usuário
// =====================================================
export async function criarUsuarioAction(
  _prevState: UsuarioActionState,
  formData: FormData
): Promise<UsuarioActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria); // reusa permissão de admin
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para criar usuários.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    email: (formData.get('email') ?? '').toString().trim().toLowerCase(),
    nomeCompleto: formData.get('nomeCompleto'),
    prontuario: formData.get('prontuario') ?? '',
    role: formData.get('role'),
    unidadeId: formData.get('unidadeId') ?? '',
  };

  const parsed = criarUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, msgs] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      if (msgs && msgs.length > 0) fieldErrors[key] = msgs;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const senhaTemporaria = gerarSenhaTemporaria();

  // Verifica se e-mail já existe em profiles
  const existentes = await db.execute(sql`
    SELECT id FROM auth.users WHERE email = ${data.email} LIMIT 1
  `);
  if (existentes.length > 0) {
    return {
      fieldErrors: { email: ['Este e-mail já está cadastrado no sistema.'] },
    };
  }

  try {
    const admin = createAdminClient();

    const { data: novoUser, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: senhaTemporaria,
      email_confirm: true, // não exige confirmação por e-mail
      user_metadata: {
        nome_completo: data.nomeCompleto,
        role: data.role,
        unidade_id: data.unidadeId || null,
      },
    });

    if (error || !novoUser.user) {
      console.error('[criarUsuarioAction] erro Supabase:', error);
      return {
        error: error?.message ?? 'Erro ao criar usuário no provedor de auth.',
      };
    }

    // O trigger on_auth_user_created já criou o profile.
    // Mas confirmamos que existe (sanity check).
    const profileCheck = await db.execute(sql`
      SELECT id FROM profiles WHERE id = ${novoUser.user.id} LIMIT 1
    `);
    if (profileCheck.length === 0) {
      // Fallback: cria o profile manualmente
      await db.execute(sql`
        INSERT INTO profiles (id, nome_completo, prontuario, role, unidade_id, ativo)
        VALUES (
          ${novoUser.user.id},
          ${data.nomeCompleto},
          ${data.prontuario || null},
          ${data.role}::user_role,
          ${data.unidadeId || null},
          true
        )
      `);
    }

    const context = await buildContext(session);
    await audit(context, {
      action: 'CREATE',
      entity: 'profiles',
      entityId: novoUser.user.id,
      after: {
        email: data.email,
        nomeCompleto: data.nomeCompleto,
        prontuario: data.prontuario || null,
        role: data.role,
        unidadeId: data.unidadeId || null,
      },
    });

    revalidatePath('/usuarios');
    return { success: true, senhaTemporaria };
  } catch (error) {
    console.error('[criarUsuarioAction] erro:', error);
    return { error: 'Erro ao criar usuário. Tente novamente.' };
  }
}

// =====================================================
// EDITAR usuário (nome, role, unidade) — não altera e-mail
// =====================================================
export async function editarUsuarioAction(
  _prevState: UsuarioActionState,
  formData: FormData
): Promise<UsuarioActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para editar usuários.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    id: formData.get('id'),
    nomeCompleto: formData.get('nomeCompleto'),
    prontuario: formData.get('prontuario') ?? '',
    role: formData.get('role'),
    unidadeId: formData.get('unidadeId') ?? '',
  };

  const parsed = editarUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, msgs] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      if (msgs && msgs.length > 0) fieldErrors[key] = msgs;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  // Não permite o admin mudar o próprio role (evita "auto-rebaixamento")
  if (data.id === session.userId && data.role !== session.role) {
    return {
      error:
        'Por segurança, você não pode alterar seu próprio perfil de acesso. Peça a outro administrador.',
    };
  }

  try {
    await db.execute(sql`
      UPDATE profiles SET
        nome_completo = ${data.nomeCompleto},
        prontuario = ${data.prontuario || null},
        role = ${data.role}::user_role,
        unidade_id = ${data.unidadeId || null},
        updated_at = NOW()
      WHERE id = ${data.id}
    `);

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'profiles',
      entityId: data.id,
      after: {
        nomeCompleto: data.nomeCompleto,
        prontuario: data.prontuario || null,
        role: data.role,
        unidadeId: data.unidadeId || null,
      },
    });

    revalidatePath('/usuarios');
    revalidatePath(`/usuarios/${data.id}`);
    return { success: true };
  } catch (error) {
    console.error('[editarUsuarioAction] erro:', error);
    return { error: 'Erro ao salvar alterações. Tente novamente.' };
  }
}

// =====================================================
// DESATIVAR / REATIVAR usuário
// =====================================================
export async function alternarStatusUsuarioAction(
  userId: string,
  ativar: boolean
): Promise<{ error?: string; success?: boolean }> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria);
  } catch {
    return { error: 'Sem permissão.' };
  }

  if (userId === session.userId) {
    return { error: 'Você não pode desativar sua própria conta.' };
  }

  try {
    // Atualiza profile
    await db.execute(sql`
      UPDATE profiles SET ativo = ${ativar}, updated_at = NOW()
      WHERE id = ${userId}
    `);

    // Atualiza status no auth (ban/unban)
    const admin = createAdminClient();
    // ban_duration: "none" remove o ban; "876000h" (~100 anos) efetivamente bloqueia
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: ativar ? 'none' : '876000h',
    });

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'profiles',
      entityId: userId,
      after: { ativo: ativar },
    });

    revalidatePath('/usuarios');
    revalidatePath(`/usuarios/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[alternarStatusUsuarioAction] erro:', error);
    return { error: 'Erro ao alterar status do usuário.' };
  }
}

// =====================================================
// RESETAR SENHA — gera nova senha temporária
// =====================================================
export async function resetarSenhaUsuarioAction(
  userId: string
): Promise<{ error?: string; senhaTemporaria?: string }> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria);
  } catch {
    return { error: 'Sem permissão.' };
  }

  try {
    const novaSenha = gerarSenhaTemporaria();
    const admin = createAdminClient();

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: novaSenha,
    });

    if (error) {
      console.error('[resetarSenhaUsuarioAction] erro:', error);
      return { error: error.message };
    }

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'profiles',
      entityId: userId,
      metadata: {
        operacao: 'RESETAR_SENHA',
      },
    });

    return { senhaTemporaria: novaSenha };
  } catch (error) {
    console.error('[resetarSenhaUsuarioAction] erro:', error);
    return { error: 'Erro ao resetar senha.' };
  }
}