// src/app/(app)/acolhimentos/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  admitirSchema,
  verificarCompatibilidade,
} from '@/lib/validations/acolhimento';
import { calcularIdade } from '@/lib/validations/acolhido';
import { can, requirePermission, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type AcolhimentoActionState = {
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
// ADMITIR — cria o acolhimento (vínculo acolhido ↔ unidade ↔ vaga)
// =====================================================
export async function admitirAction(
  _prevState: AcolhimentoActionState,
  formData: FormData
): Promise<AcolhimentoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.cadastrarAcolhido);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para registrar admissões.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    acolhidoId: formData.get('acolhidoId'),
    unidadeId: formData.get('unidadeId'),
    vagaId: formData.get('vagaId'),
    dataAcolhimento: formData.get('dataAcolhimento'),
    motivo: formData.get('motivo'),
    motivoDetalhe: formData.get('motivoDetalhe') ?? '',
    regime: formData.get('regime'),
  };

  const parsed = admitirSchema.safeParse(raw);
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

  let protocolo: string;
  let acolhimentoId: string;

  try {
    const resultado = await db.transaction(async (tx) => {
      // 1. Busca o acolhido (precisamos da idade + checar se já tem acolhimento ativo)
      const acolhidoRows = await tx.execute(sql`
        SELECT id, nome_completo, data_nascimento
        FROM acolhidos
        WHERE id = ${data.acolhidoId}
        LIMIT 1
      `);

      if (acolhidoRows.length === 0) {
        throw new Error('ACOLHIDO_NOT_FOUND');
      }

      const acolhido = acolhidoRows[0] as {
        id: string;
        nome_completo: string;
        data_nascimento: string;
      };

      // RN-03: nenhum acolhimento ativo para o mesmo acolhido
      const ativosRows = await tx.execute(sql`
        SELECT id FROM acolhimentos
        WHERE acolhido_id = ${data.acolhidoId}
          AND ativo = true
        LIMIT 1
      `);
      if (ativosRows.length > 0) {
        throw new Error('ACOLHIMENTO_ATIVO_EXISTENTE');
      }

      // 2. Busca a unidade (para validar compatibilidade de tipo)
      const unidadeRows = await tx.execute(sql`
        SELECT id, nome, tipo, ativo
        FROM unidades
        WHERE id = ${data.unidadeId}
        LIMIT 1
      `);
      if (unidadeRows.length === 0) {
        throw new Error('UNIDADE_NOT_FOUND');
      }
      const unidade = unidadeRows[0] as {
        id: string;
        nome: string;
        tipo: string;
        ativo: boolean;
      };

      if (!unidade.ativo) {
        throw new Error('UNIDADE_INATIVA');
      }

      // RN-01: compatibilidade etária
      const idade = calcularIdade(acolhido.data_nascimento);
      const compat = verificarCompatibilidade(idade, unidade.tipo);
      if (!compat.compativel) {
        throw new Error(`INCOMPATIVEL:${compat.motivo}`);
      }

      // 3. Busca a vaga (precisa existir, ser da unidade correta e estar DISPONIVEL)
      const vagaRows = await tx.execute(sql`
        SELECT id, status, unidade_id, numero_leito
        FROM vagas
        WHERE id = ${data.vagaId}
        LIMIT 1
      `);
      if (vagaRows.length === 0) {
        throw new Error('VAGA_NOT_FOUND');
      }
      const vaga = vagaRows[0] as {
        id: string;
        status: string;
        unidade_id: string;
        numero_leito: number;
      };

      if (vaga.unidade_id !== data.unidadeId) {
        throw new Error('VAGA_UNIDADE_DIVERGENTE');
      }

      if (vaga.status !== 'DISPONIVEL') {
        throw new Error('VAGA_INDISPONIVEL');
      }

      // 4. Gera o protocolo
      const protocoloRows = await tx.execute(sql`
        SELECT private.gerar_protocolo_acolhimento() AS protocolo
      `);
      const protocoloGerado = (protocoloRows[0] as { protocolo: string })
        .protocolo;

      // 5. Cria o acolhimento
      const acolhimentoRows = await tx.execute(sql`
        INSERT INTO acolhimentos (
          acolhido_id, unidade_id, data_acolhimento,
          motivo_acolhimento, motivo_detalhe, regime,
          ativo, criado_por_user_id, protocolo
        ) VALUES (
          ${data.acolhidoId},
          ${data.unidadeId},
          ${data.dataAcolhimento}::date,
          ${data.motivo},
          ${data.motivoDetalhe || null},
          ${data.regime},
          true,
          ${session.userId},
          ${protocoloGerado}
        )
        RETURNING id
      `);
      const novoId = (acolhimentoRows[0] as { id: string }).id;

      // 6. Ocupa a vaga
      await tx.execute(sql`
        UPDATE vagas SET
          status = 'OCUPADA',
          acolhimento_atual_id = ${novoId},
          updated_at = NOW()
        WHERE id = ${data.vagaId}
      `);

      return {
        protocolo: protocoloGerado,
        acolhimentoId: novoId,
        nomeAcolhido: acolhido.nome_completo,
        nomeUnidade: unidade.nome,
        numeroLeito: vaga.numero_leito,
      };
    });

    protocolo = resultado.protocolo;
    acolhimentoId = resultado.acolhimentoId;

    // 7. Auditoria
    const context = await buildContext(session);
    await audit(context, {
      action: 'CREATE',
      entity: 'acolhimentos',
      entityId: acolhimentoId,
      after: {
        protocolo,
        acolhidoId: data.acolhidoId,
        unidadeId: data.unidadeId,
        vagaId: data.vagaId,
        regime: data.regime,
        motivo: data.motivo,
        dataAcolhimento: data.dataAcolhimento,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'ACOLHIDO_NOT_FOUND') {
        return { error: 'Pessoa acolhida não encontrada.' };
      }
      if (msg === 'ACOLHIMENTO_ATIVO_EXISTENTE') {
        return {
          error:
            'Esta pessoa já possui um acolhimento ativo. Realize o desacolhimento antes de registrar uma nova admissão.',
        };
      }
      if (msg === 'UNIDADE_NOT_FOUND') {
        return { error: 'Unidade não encontrada.' };
      }
      if (msg === 'UNIDADE_INATIVA') {
        return {
          error:
            'A unidade está inativa e não pode receber novas admissões.',
        };
      }
      if (msg.startsWith('INCOMPATIVEL:')) {
        return { error: msg.substring('INCOMPATIVEL:'.length) };
      }
      if (msg === 'VAGA_NOT_FOUND') {
        return { error: 'Leito não encontrado.' };
      }
      if (msg === 'VAGA_UNIDADE_DIVERGENTE') {
        return {
          error: 'O leito selecionado não pertence à unidade informada.',
        };
      }
      if (msg === 'VAGA_INDISPONIVEL') {
        return {
          error:
            'O leito selecionado não está mais disponível. Escolha outro.',
        };
      }
    }
    console.error('[admitirAction] erro:', error);
    return { error: 'Erro ao registrar admissão. Tente novamente.' };
  }

  revalidatePath('/acolhimentos');
  revalidatePath('/vagas');
  redirect(`/acolhimentos/${acolhimentoId}`);
}