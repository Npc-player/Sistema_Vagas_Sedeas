// src/app/(app)/acolhimentos/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  admitirSchema,
  desacolherSchema,
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
    numeroProcesso: formData.get('numeroProcesso') ?? '',
    numeroMedidaProtetiva: formData.get('numeroMedidaProtetiva') ?? '',
    numeroGuiaAcolhimento: formData.get('numeroGuiaAcolhimento') ?? '',
    territorio: formData.get('territorio') ?? '',
    asVaraInfancia: formData.get('asVaraInfancia') ?? '',
    psicVaraInfancia: formData.get('psicVaraInfancia') ?? '',
    asCreas: formData.get('asCreas') ?? '',
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
          numero_processo, numero_medida_protetiva,
          numero_guia_acolhimento, territorio,
          as_vara_infancia, psic_vara_infancia, as_creas,
          ativo, criado_por_user_id, protocolo
        ) VALUES (
          ${data.acolhidoId},
          ${data.unidadeId},
          ${data.dataAcolhimento}::date,
          ${data.motivo},
          ${data.motivoDetalhe || null},
          ${data.regime},
          ${data.numeroProcesso || null},
          ${data.numeroMedidaProtetiva || null},
          ${data.numeroGuiaAcolhimento || null},
          ${data.territorio || null},
          ${data.asVaraInfancia || null},
          ${data.psicVaraInfancia || null},
          ${data.asCreas || null},
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
        numeroProcesso: data.numeroProcesso || null,
        numeroMedidaProtetiva: data.numeroMedidaProtetiva || null,
        numeroGuiaAcolhimento: data.numeroGuiaAcolhimento || null,
        territorio: data.territorio || null,
        asVaraInfancia: data.asVaraInfancia || null,
        psicVaraInfancia: data.psicVaraInfancia || null,
        asCreas: data.asCreas || null,
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
        return { error: 'Vaga não encontrada.' };
      }
      if (msg === 'VAGA_UNIDADE_DIVERGENTE') {
        return {
          error: 'A vaga selecionada não pertence à unidade informada.',
        };
      }
      if (msg === 'VAGA_INDISPONIVEL') {
        return {
          error:
            'A vaga selecionada não está mais disponível. Escolha outra.',
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

// =====================================================
// DESACOLHER — encerra o acolhimento e libera a vaga
// =====================================================
export async function desacolherAction(
  _prevState: AcolhimentoActionState,
  formData: FormData
): Promise<AcolhimentoActionState> {
  let session: Session;
  try {
    session = await requirePermission(can.cadastrarAcolhido);
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN') {
      return { error: 'Você não tem permissão para registrar desacolhimentos.' };
    }
    if (e instanceof Error && e.message === 'UNAUTHENTICATED') {
      return { error: 'Sessão expirada. Faça login novamente.' };
    }
    throw e;
  }

  const raw = {
    acolhimentoId: formData.get('acolhimentoId'),
    dataDesacolhimento: formData.get('dataDesacolhimento'),
    motivoDesacolhimento: formData.get('motivoDesacolhimento'),
    motivoDesacolhimentoDetalhe:
      formData.get('motivoDesacolhimentoDetalhe') ?? '',
  };

  const parsed = desacolherSchema.safeParse(raw);
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
      // 1. Busca o acolhimento
      const rows = await tx.execute(sql`
        SELECT id, data_acolhimento, ativo
        FROM acolhimentos
        WHERE id = ${data.acolhimentoId}
        LIMIT 1
      `);

      if (rows.length === 0) {
        throw new Error('ACOLHIMENTO_NOT_FOUND');
      }

      const acolhimento = rows[0] as {
        id: string;
        data_acolhimento: string;
        ativo: boolean;
      };

      if (!acolhimento.ativo) {
        throw new Error('ACOLHIMENTO_JA_ENCERRADO');
      }

      // RN-05: coerência cronológica
      const dataEntrada = new Date(
        acolhimento.data_acolhimento + 'T00:00:00'
      );
      const dataSaida = new Date(data.dataDesacolhimento + 'T00:00:00');

      if (dataSaida < dataEntrada) {
        throw new Error('DATA_ANTERIOR_A_ENTRADA');
      }

      // 2. Atualiza o acolhimento
      await tx.execute(sql`
        UPDATE acolhimentos SET
          ativo = false,
          data_desacolhimento = ${data.dataDesacolhimento}::date,
          motivo_desacolhimento = ${data.motivoDesacolhimento},
          motivo_desacolhimento_detalhe = ${data.motivoDesacolhimentoDetalhe || null},
          updated_at = NOW()
        WHERE id = ${data.acolhimentoId}
      `);

      // 3. Libera a vaga vinculada (se ainda estiver vinculada a este acolhimento)
      await tx.execute(sql`
        UPDATE vagas SET
          status = 'DISPONIVEL',
          acolhimento_atual_id = NULL,
          updated_at = NOW()
        WHERE acolhimento_atual_id = ${data.acolhimentoId}
      `);
    });

    // 4. Auditoria
    const context = await buildContext(session);
    await audit(context, {
      action: 'UPDATE',
      entity: 'acolhimentos',
      entityId: data.acolhimentoId,
      after: {
        ativo: false,
        dataDesacolhimento: data.dataDesacolhimento,
        motivoDesacolhimento: data.motivoDesacolhimento,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'ACOLHIMENTO_NOT_FOUND') {
        return { error: 'Acolhimento não encontrado.' };
      }
      if (msg === 'ACOLHIMENTO_JA_ENCERRADO') {
        return { error: 'Este acolhimento já foi encerrado.' };
      }
      if (msg === 'DATA_ANTERIOR_A_ENTRADA') {
        return {
          error:
            'A data do desacolhimento não pode ser anterior à data do acolhimento.',
        };
      }
    }
    console.error('[desacolherAction] erro:', error);
    return { error: 'Erro ao registrar desacolhimento. Tente novamente.' };
  }

  revalidatePath('/acolhimentos');
  revalidatePath('/vagas');
  redirect(`/acolhimentos/${data.acolhimentoId}`);
}