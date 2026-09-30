// src/app/(app)/vagas/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { vagas } from '@/db/schema';
import { bloquearVagaSchema } from '@/lib/validations/vaga';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type VagaActionState = {
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
// Bloquear vaga (RN-08)
// =====================================================
export async function bloquearVagaAction(
  _prevState: VagaActionState,
  formData: FormData
): Promise<VagaActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.editarVagas);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para bloquear vagas.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    vagaId: formData.get('vagaId'),
    motivo: formData.get('motivo'),
    motivoDetalhe: formData.get('motivoDetalhe') ?? '',
    prazo: formData.get('prazo'),
  };

  const parsed = bloquearVagaSchema.safeParse(raw);
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
    await db.transaction(async (tx) => {
      const [antes] = await tx
        .select()
        .from(vagas)
        .where(eq(vagas.id, data.vagaId))
        .limit(1);

      if (!antes) throw new Error('NOT_FOUND');

      // RN-08: só é possível bloquear vaga DISPONIVEL
      if (antes.status !== 'DISPONIVEL') {
        throw new Error('STATUS_INVALIDO');
      }

      await tx
        .update(vagas)
        .set({
          status: 'BLOQUEADA',
          motivoBloqueio: data.motivoDetalhe
            ? `${data.motivo} — ${data.motivoDetalhe}`
            : data.motivo,
          prazoBloqueio: data.prazo,
          updatedAt: new Date(),
        })
        .where(eq(vagas.id, data.vagaId));
    });

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'vagas',
      entityId: data.vagaId,
      after: {
        status: 'BLOQUEADA',
        motivo: data.motivo,
        prazo: data.prazo,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return { error: 'Vaga não encontrada.' };
      }
      if (error.message === 'STATUS_INVALIDO') {
        return {
          error:
            'Só é possível bloquear vagas com status Disponível.',
        };
      }
    }
    console.error('[bloquearVagaAction] erro:', error);
    return { error: 'Erro ao bloquear vaga. Tente novamente.' };
  }

  revalidatePath('/vagas');
  return { success: true };
}

// =====================================================
// Desbloquear vaga
// =====================================================
export async function desbloquearVagaAction(
  vagaId: string
): Promise<{ error?: string; success?: boolean }> {
  let session: Session;
  try {
    session = await requirePermission(can.editarVagas);
  } catch {
    return { error: 'Sem permissão para desbloquear vagas.' };
  }

  try {
    await db.transaction(async (tx) => {
      const [antes] = await tx
        .select()
        .from(vagas)
        .where(eq(vagas.id, vagaId))
        .limit(1);

      if (!antes) throw new Error('NOT_FOUND');

      if (antes.status !== 'BLOQUEADA') {
        throw new Error('STATUS_INVALIDO');
      }

      await tx
        .update(vagas)
        .set({
          status: 'DISPONIVEL',
          motivoBloqueio: null,
          prazoBloqueio: null,
          updatedAt: new Date(),
        })
        .where(eq(vagas.id, vagaId));
    });

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'vagas',
      entityId: vagaId,
      after: { status: 'DISPONIVEL' },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return { error: 'Vaga não encontrada.' };
      }
      if (error.message === 'STATUS_INVALIDO') {
        return { error: 'Só é possível desbloquear vagas Bloqueadas.' };
      }
    }
    console.error('[desbloquearVagaAction] erro:', error);
    return { error: 'Erro ao desbloquear vaga.' };
  }

  revalidatePath('/vagas');
  return { success: true };
}