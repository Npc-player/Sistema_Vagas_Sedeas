// src/app/(app)/unidades/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { unidades, vagas } from '@/db/schema';
import {
  unidadeSchema,
  editarUnidadeSchema,
} from '@/lib/validations/unidade';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type UnidadeActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Monta o contexto de audit a partir de uma sessão já validada.
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
// Criar unidade
// =====================================================
export async function criarUnidadeAction(
  _prevState: UnidadeActionState,
  formData: FormData
): Promise<UnidadeActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.criarUnidade);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para criar unidades.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    nome: formData.get('nome'),
    tipo: formData.get('tipo'),
    cnpj: formData.get('cnpj') ?? '',
    logradouro: formData.get('logradouro'),
    numero: formData.get('numero'),
    complemento: formData.get('complemento') ?? '',
    bairro: formData.get('bairro'),
    cidade: formData.get('cidade'),
    uf: formData.get('uf'),
    cep: formData.get('cep'),
    telefoneInstitucional: formData.get('telefoneInstitucional'),
    emailInstitucional: formData.get('emailInstitucional'),
    capacidadeTotal: Number(formData.get('capacidadeTotal')),
    responsavelNome: formData.get('responsavelNome'),
    responsavelTelefone: formData.get('responsavelTelefone'),
    responsavelEmail: formData.get('responsavelEmail'),
  };

  const parsed = unidadeSchema.safeParse(raw);
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

  let newId: string;
  try {
    const result = await db.transaction(async (tx) => {
      const [unidade] = await tx
        .insert(unidades)
        .values({
          nome: data.nome,
          tipo: data.tipo,
          cnpj: data.cnpj || null,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento || null,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep,
          telefoneInstitucional: data.telefoneInstitucional,
          emailInstitucional: data.emailInstitucional,
          capacidadeTotal: data.capacidadeTotal,
          responsavelNome: data.responsavelNome,
          responsavelTelefone: data.responsavelTelefone,
          responsavelEmail: data.responsavelEmail,
          ativo: true,
        })
        .returning();

      const vagasValues = Array.from(
        { length: data.capacidadeTotal },
        (_, i) => ({
          unidadeId: unidade.id,
          numeroLeito: i + 1,
          status: 'DISPONIVEL' as const,
        })
      );
      await tx.insert(vagas).values(vagasValues);

      return unidade;
    });

    newId = result.id;

    const context = await buildContext(session);
    await audit(context, {
      action: 'CREATE',
      entity: 'unidades',
      entityId: newId,
      after: data,
    });
  } catch (error) {
    console.error('[criarUnidadeAction] erro:', error);
    return {
      error: 'Erro ao criar unidade. Tente novamente em instantes.',
    };
  }

  revalidatePath('/unidades');
  redirect('/unidades');
}

// =====================================================
// Editar unidade
// =====================================================
export async function editarUnidadeAction(
  _prevState: UnidadeActionState,
  formData: FormData
): Promise<UnidadeActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.editarUnidade);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para editar unidades.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    id: formData.get('id'),
    nome: formData.get('nome'),
    tipo: formData.get('tipo'),
    cnpj: formData.get('cnpj') ?? '',
    logradouro: formData.get('logradouro'),
    numero: formData.get('numero'),
    complemento: formData.get('complemento') ?? '',
    bairro: formData.get('bairro'),
    cidade: formData.get('cidade'),
    uf: formData.get('uf'),
    cep: formData.get('cep'),
    telefoneInstitucional: formData.get('telefoneInstitucional'),
    emailInstitucional: formData.get('emailInstitucional'),
    capacidadeTotal: Number(formData.get('capacidadeTotal')),
    responsavelNome: formData.get('responsavelNome'),
    responsavelTelefone: formData.get('responsavelTelefone'),
    responsavelEmail: formData.get('responsavelEmail'),
  };

  const parsed = editarUnidadeSchema.safeParse(raw);
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
        .from(unidades)
        .where(eq(unidades.id, data.id))
        .limit(1);

      if (!antes) {
        throw new Error('NOT_FOUND');
      }

      await tx
        .update(unidades)
        .set({
          nome: data.nome,
          tipo: data.tipo,
          cnpj: data.cnpj || null,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento || null,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep,
          telefoneInstitucional: data.telefoneInstitucional,
          emailInstitucional: data.emailInstitucional,
          capacidadeTotal: data.capacidadeTotal,
          responsavelNome: data.responsavelNome,
          responsavelTelefone: data.responsavelTelefone,
          responsavelEmail: data.responsavelEmail,
          updatedAt: new Date(),
        })
        .where(eq(unidades.id, data.id));

      const capacidadeAntiga = antes.capacidadeTotal;
      const capacidadeNova = data.capacidadeTotal;

      if (capacidadeNova > capacidadeAntiga) {
        const novasVagas = Array.from(
          { length: capacidadeNova - capacidadeAntiga },
          (_, i) => ({
            unidadeId: data.id,
            numeroLeito: capacidadeAntiga + i + 1,
            status: 'DISPONIVEL' as const,
          })
        );
        await tx.insert(vagas).values(novasVagas);
      } else if (capacidadeNova < capacidadeAntiga) {
        const vagasRemover = await tx
          .select({ id: vagas.id, status: vagas.status })
          .from(vagas)
          .where(
            and(
              eq(vagas.unidadeId, data.id),
              gt(vagas.numeroLeito, capacidadeNova)
            )
          );

        const bloqueadas = vagasRemover.filter(
          (v) => v.status !== 'DISPONIVEL'
        );
        if (bloqueadas.length > 0) {
          throw new Error('VAGAS_OCUPADAS');
        }

        for (const v of vagasRemover) {
          await tx.delete(vagas).where(eq(vagas.id, v.id));
        }
      }

      return antes;
    });

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'unidades',
      entityId: data.id,
      after: data,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return { error: 'Unidade não encontrada.' };
      }
      if (error.message === 'VAGAS_OCUPADAS') {
        return {
          error:
            'Não é possível reduzir a capacidade: há vagas ocupadas ou bloqueadas acima do novo limite.',
        };
      }
    }
    console.error('[editarUnidadeAction] erro:', error);
    return { error: 'Erro ao salvar alterações. Tente novamente.' };
  }

  revalidatePath('/unidades');
  revalidatePath(`/unidades/${data.id}`);
  redirect(`/unidades/${data.id}`);
}

// =====================================================
// Alternar status (ativar/desativar)
// =====================================================
export async function alternarStatusUnidadeAction(
  unidadeId: string,
  ativar: boolean
): Promise<{ error?: string }> {
  let session: Session;
  try {
    session = await requirePermission(can.desativarUnidade);
  } catch {
    return { error: 'Sem permissão para alterar o status da unidade.' };
  }

  try {
    await db.transaction(async (tx) => {
      const [antes] = await tx
        .select()
        .from(unidades)
        .where(eq(unidades.id, unidadeId))
        .limit(1);

      if (!antes) throw new Error('NOT_FOUND');

      await tx
        .update(unidades)
        .set({ ativo: ativar, updatedAt: new Date() })
        .where(eq(unidades.id, unidadeId));
    });

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'unidades',
      entityId: unidadeId,
      after: { ativo: ativar },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return { error: 'Unidade não encontrada.' };
    }
    console.error('[alternarStatusUnidadeAction] erro:', error);
    return { error: 'Erro ao alterar status da unidade.' };
  }

  revalidatePath('/unidades');
  revalidatePath(`/unidades/${unidadeId}`);
  return {};
}