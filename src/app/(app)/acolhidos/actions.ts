// src/app/(app)/acolhidos/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  acolhidoSchema,
  editarAcolhidoSchema,
  normalizarCpf,
} from '@/lib/validations/acolhido';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type AcolhidoActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Lê a chave de criptografia com falha explícita (nunca deve ser undefined)
function getSecret(): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY não configurada — impossível criptografar dados sensíveis'
    );
  }
  return secret;
}

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

// Extrai e normaliza os campos do FormData (comum a create/update)
function extrairCampos(formData: FormData) {
  return {
    nomeCompleto: formData.get('nomeCompleto'),
    nomeSocial: formData.get('nomeSocial') ?? '',
    dataNascimento: formData.get('dataNascimento'),
    nomeMae: formData.get('nomeMae') ?? '',
    nomePai: formData.get('nomePai') ?? '',
    cpf: formData.get('cpf') ?? '',
    rg: formData.get('rg') ?? '',
    alergias: formData.get('alergias') ?? '',
    comorbidades: formData.get('comorbidades') ?? '',
    familiaHistorico: formData.get('familiaHistorico') ?? '',
  };
}

// =====================================================
// CRIAR acolhido
// =====================================================
export async function criarAcolhidoAction(
  _prevState: AcolhidoActionState,
  formData: FormData
): Promise<AcolhidoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.cadastrarAcolhido);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para cadastrar acolhidos.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const parsed = acolhidoSchema.safeParse(extrairCampos(formData));
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
  const secret = getSecret();
  const cpfNormalizado = normalizarCpf(data.cpf);
  const cpfParaStorage = cpfNormalizado || null;

  // RN-03: verifica unicidade do CPF (só se informado)
  if (cpfParaStorage) {
    try {
      const existente = await db.execute(sql`
        SELECT id FROM acolhidos
        WHERE cpf_hash = private.hmac_value(${cpfParaStorage}, ${secret})
        LIMIT 1
      `);
      if (existente.length > 0) {
        return {
          fieldErrors: {
            cpf: ['Já existe um acolhido cadastrado com este CPF.'],
          },
        };
      }
    } catch (error) {
      console.error('[criarAcolhidoAction] erro na checagem de CPF:', error);
      return { error: 'Erro ao verificar CPF. Tente novamente.' };
    }
  }

  let newId: string;
  try {
    const result = await db.execute(sql`
      INSERT INTO acolhidos (
        nome_completo, nome_social, data_nascimento, nome_mae, nome_pai,
        cpf_encrypted, cpf_hash, rg_encrypted,
        alergias_encrypted, comorbidades_encrypted,
        familia_historico
      ) VALUES (
        ${data.nomeCompleto},
        ${data.nomeSocial || null},
        ${data.dataNascimento}::date,
        ${data.nomeMae || null},
        ${data.nomePai || null},
        private.encrypt_text(${cpfParaStorage}, ${secret}),
        private.hmac_value(${cpfParaStorage}, ${secret}),
        private.encrypt_text(${data.rg || null}, ${secret}),
        private.encrypt_text(${data.alergias || null}, ${secret}),
        private.encrypt_text(${data.comorbidades || null}, ${secret}),
        ${data.familiaHistorico || null}
      )
      RETURNING id
    `);

    newId = (result[0] as { id: string }).id;

    const context = await buildContext(session);
    await audit(context, {
      action: 'CREATE',
      entity: 'acolhidos',
      entityId: newId,
      // ⚠️ LGPD: nunca gravar CPF/RG/saúde no audit log — só metadados
      after: {
        nomeCompleto: data.nomeCompleto,
        dataNascimento: data.dataNascimento,
        temCpf: !!cpfParaStorage,
        temRg: !!data.rg,
      },
    });
  } catch (error) {
    console.error('[criarAcolhidoAction] erro:', error);
    return { error: 'Erro ao cadastrar acolhido. Tente novamente.' };
  }

  revalidatePath('/acolhidos');
  redirect(`/acolhidos/${newId}`);
}

// =====================================================
// EDITAR acolhido
// =====================================================
export async function editarAcolhidoAction(
  _prevState: AcolhidoActionState,
  formData: FormData
): Promise<AcolhidoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.cadastrarAcolhido);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para editar acolhidos.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    ...extrairCampos(formData),
    id: formData.get('id'),
  };

  const parsed = editarAcolhidoSchema.safeParse(raw);
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
  const secret = getSecret();
  const cpfNormalizado = normalizarCpf(data.cpf);
  const cpfParaStorage = cpfNormalizado || null;

  // RN-03: unicidade do CPF (excluindo o próprio acolhido)
  if (cpfParaStorage) {
    try {
      const existente = await db.execute(sql`
        SELECT id FROM acolhidos
        WHERE cpf_hash = private.hmac_value(${cpfParaStorage}, ${secret})
          AND id <> ${data.id}
        LIMIT 1
      `);
      if (existente.length > 0) {
        return {
          fieldErrors: {
            cpf: ['Já existe outro acolhido cadastrado com este CPF.'],
          },
        };
      }
    } catch (error) {
      console.error('[editarAcolhidoAction] erro na checagem de CPF:', error);
      return { error: 'Erro ao verificar CPF. Tente novamente.' };
    }
  }

  try {
    await db.execute(sql`
      UPDATE acolhidos SET
        nome_completo = ${data.nomeCompleto},
        nome_social = ${data.nomeSocial || null},
        data_nascimento = ${data.dataNascimento}::date,
        nome_mae = ${data.nomeMae || null},
        nome_pai = ${data.nomePai || null},
        cpf_encrypted = private.encrypt_text(${cpfParaStorage}, ${secret}),
        cpf_hash = private.hmac_value(${cpfParaStorage}, ${secret}),
        rg_encrypted = private.encrypt_text(${data.rg || null}, ${secret}),
        alergias_encrypted = private.encrypt_text(${data.alergias || null}, ${secret}),
        comorbidades_encrypted = private.encrypt_text(${data.comorbidades || null}, ${secret}),
        familia_historico = ${data.familiaHistorico || null},
        updated_at = NOW()
      WHERE id = ${data.id}
    `);

    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'acolhidos',
      entityId: data.id,
      after: {
        nomeCompleto: data.nomeCompleto,
        dataNascimento: data.dataNascimento,
        temCpf: !!cpfParaStorage,
      },
    });
  } catch (error) {
    console.error('[editarAcolhidoAction] erro:', error);
    return { error: 'Erro ao salvar alterações. Tente novamente.' };
  }

  revalidatePath('/acolhidos');
  revalidatePath(`/acolhidos/${data.id}`);
  redirect(`/acolhidos/${data.id}`);
}