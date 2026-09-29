// src/app/unidades/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/db/client';
import { unidades, vagas } from '@/db/schema';
import { unidadeSchema } from '@/lib/validations/unidade';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type UnidadeActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Monta o contexto de audit a partir de uma sessão já validada
// (evita re-consultar auth.getUser() + profile).
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

export async function criarUnidadeAction(
  _prevState: UnidadeActionState,
  formData: FormData
): Promise<UnidadeActionState> {
  // 1. Verificar permissão
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

  // 2. Extrair dados do FormData
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

  // 3. Validar com Zod
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

  // 4. Persistir em transação (unidade + N vagas)
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

    // 5. Registrar auditoria
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

  // 6. Revalidar cache e redirecionar (fora do try — redirect lança exceção)
  revalidatePath('/unidades');
  redirect('/unidades');
}