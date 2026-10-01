// src/app/(app)/dpo/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  configuracaoDpoSchema,
  responderRequisicaoLgpdSchema,
} from '@/lib/validations/dpo';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type DpoActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
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

// =====================================================
// Atualizar configuração do DPO
// =====================================================
export async function atualizarDpoConfigAction(
  _prevState: DpoActionState,
  formData: FormData
): Promise<DpoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return {
        error: 'Apenas o Administrador Municipal pode alterar o DPO.',
      };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    nomeCompleto: formData.get('nomeCompleto'),
    email: formData.get('email'),
    telefone: formData.get('telefone') ?? '',
    cargo: formData.get('cargo') ?? '',
    endereco: formData.get('endereco') ?? '',
    horarioAtendimento: formData.get('horarioAtendimento') ?? '',
    observacoes: formData.get('observacoes') ?? '',
  };

  const parsed = configuracaoDpoSchema.safeParse(raw);
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

  try {
    // Atualiza (ou insere se não existir) o registro ativo
    const existe = await db.execute(sql`
      SELECT id FROM dpo_configuracao WHERE ativo = true LIMIT 1
    `);

    if (existe.length > 0) {
      await db.execute(sql`
        UPDATE dpo_configuracao SET
          nome_completo = ${data.nomeCompleto},
          email = ${data.email},
          telefone = ${data.telefone || null},
          cargo = ${data.cargo || null},
          endereco = ${data.endereco || null},
          horario_atendimento = ${data.horarioAtendimento || null},
          observacoes = ${data.observacoes || null},
          updated_by_user_id = ${session.userId},
          updated_at = NOW()
        WHERE ativo = true
      `);
    } else {
      await db.execute(sql`
        INSERT INTO dpo_configuracao (
          nome_completo, email, telefone, cargo,
          endereco, horario_atendimento, observacoes,
          ativo, updated_by_user_id
        ) VALUES (
          ${data.nomeCompleto},
          ${data.email},
          ${data.telefone || null},
          ${data.cargo || null},
          ${data.endereco || null},
          ${data.horarioAtendimento || null},
          ${data.observacoes || null},
          true,
          ${session.userId}
        )
      `);
    }

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'profiles', // não temos entidade DPO; usamos profiles como genérica
      entityId: session.userId,
      metadata: {
        operacao: 'ATUALIZAR_DPO',
        novoNome: data.nomeCompleto,
        novoEmail: data.email,
      },
    });

    revalidatePath('/dpo');
    return { success: true };
  } catch (error) {
    console.error('[atualizarDpoConfigAction] erro:', error);
    return { error: 'Erro ao salvar configuração. Tente novamente.' };
  }
}

// =====================================================
// Responder / alterar status da requisição LGPD
// =====================================================
export async function responderRequisicaoAction(
  _prevState: DpoActionState,
  formData: FormData
): Promise<DpoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.verAuditoria);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return {
        error: 'Apenas o Administrador Municipal pode gerenciar requisições.',
      };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    requisicaoId: formData.get('requisicaoId'),
    resposta: formData.get('resposta'),
    novoStatus: formData.get('novoStatus'),
  };

  const parsed = responderRequisicaoLgpdSchema.safeParse(raw);
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

  try {
    const existe = await db.execute(sql`
      SELECT id, status::text FROM lgpd_requisicoes
      WHERE id = ${data.requisicaoId}
      LIMIT 1
    `);
    if (existe.length === 0) {
      return { error: 'Requisição não encontrada.' };
    }

    const respondidoEm =
      data.novoStatus === 'RESPONDIDA' ? new Date() : null;

    await db.execute(sql`
      UPDATE lgpd_requisicoes SET
        resposta = ${data.resposta},
        status = ${data.novoStatus}::lgpd_requisicao_status,
        respondido_por_user_id = ${
          data.novoStatus === 'RESPONDIDA' ? session.userId : null
        },
        respondido_em = ${respondidoEm},
        updated_at = NOW()
      WHERE id = ${data.requisicaoId}
    `);

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'profiles',
      entityId: data.requisicaoId,
      metadata: {
        operacao: 'RESPONDER_REQUISICAO_LGPD',
        novoStatus: data.novoStatus,
      },
    });

    revalidatePath('/dpo');
    revalidatePath(`/dpo/requisicoes/${data.requisicaoId}`);
    return { success: true };
  } catch (error) {
    console.error('[responderRequisicaoAction] erro:', error);
    return { error: 'Erro ao salvar resposta. Tente novamente.' };
  }
}