// src/app/(app)/judiciario/actions.ts
'use server';

import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  consultaJudicialSchema,
  type ConsultaJudicialInput,
} from '@/lib/validations/consulta-judicial';
import { getSession, type Session } from '@/lib/rbac';
import { audit } from '@/lib/audit/log';
import type { AuditContext } from '@/lib/audit/types';

export type ConsultaJudicialState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  protocoloConsulta?: string;
  resultados?: ResultadoJudicial[];
  totalResultados?: number;
  filtroAplicado?: {
    tipo: string;
    termo: string;
    justificativa: string;
    processoJudicial?: string;
  };
};

export interface ResultadoJudicial {
  acolhidoId: string;
  nomeCompleto: string;
  nomeSocial: string | null;
  dataNascimento: string;
  idade: number;
  nomeMae: string | null;
  nomePai: string | null;
  cpf: string | null;
  rg: string | null;
  familiaHistorico: string | null;
  // Dados de saúde NÃO são expostos — protegidos por LGPD Art. 11
  temDadosSaude: boolean;
  acolhimentos: AcolhimentoJudicial[];
}

export interface AcolhimentoJudicial {
  protocolo: string;
  unidadeNome: string;
  unidadeTipo: string;
  dataAcolhimento: string;
  dataDesacolhimento: string | null;
  motivoAcolhimento: string;
  regime: string;
  ativo: boolean;
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

function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function gerarProtocoloConsulta(): string {
  const agora = new Date();
  return `CJU-${agora.getFullYear()}-${String(agora.getTime()).slice(-8)}`;
}

function getSecret(): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) throw new Error('FIELD_ENCRYPTION_KEY não configurada');
  return secret;
}

function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

// =====================================================
// Buscar acolhidos (respeitando o tipo de busca)
// =====================================================
async function buscarAcolhidos(
  input: ConsultaJudicialInput
): Promise<string[]> {
  const secret = getSecret();

  if (input.tipo === 'CPF') {
    const cpfLimpo = input.termo.replace(/\D/g, '');
    const rows = await db.execute(sql`
      SELECT id FROM acolhidos
      WHERE cpf_hash = private.hmac_value(${cpfLimpo}, ${secret})
      LIMIT 20
    `);
    return allRows<{ id: string }>(rows).map((r) => r.id);
  }

  if (input.tipo === 'PROTOCOLO') {
    const rows = await db.execute(sql`
      SELECT DISTINCT a.id
      FROM acolhidos a
      INNER JOIN acolhimentos ac ON ac.acolhido_id = a.id
      WHERE ac.protocolo = ${input.termo}
      LIMIT 20
    `);
    return allRows<{ id: string }>(rows).map((r) => r.id);
  }

  // NOME — busca parcial (ILIKE sem acento)
  const rows = await db.execute(sql`
    SELECT id FROM acolhidos
    WHERE nome_completo ILIKE ${'%' + input.termo + '%'}
       OR nome_social ILIKE ${'%' + input.termo + '%'}
    ORDER BY nome_completo
    LIMIT 20
  `);
  return allRows<{ id: string }>(rows).map((r) => r.id);
}

// =====================================================
// Carregar dados de um acolhido (visão judiciário)
// =====================================================
async function carregarAcolhido(
  acolhidoId: string
): Promise<ResultadoJudicial | null> {
  const secret = getSecret();

  const dadosRows = await db.execute(sql`
    SELECT
      id,
      nome_completo AS "nomeCompleto",
      nome_social AS "nomeSocial",
      data_nascimento AS "dataNascimento",
      nome_mae AS "nomeMae",
      nome_pai AS "nomePai",
      familia_historico AS "familiaHistorico",
      private.decrypt_text(cpf_encrypted, ${secret}) AS cpf,
      private.decrypt_text(rg_encrypted, ${secret}) AS rg,
      (alergias_encrypted IS NOT NULL OR comorbidades_encrypted IS NOT NULL) AS "temDadosSaude"
    FROM acolhidos
    WHERE id = ${acolhidoId}
    LIMIT 1
  `);

  const dados = allRows<{
    id: string;
    nomeCompleto: string;
    nomeSocial: string | null;
    dataNascimento: string;
    nomeMae: string | null;
    nomePai: string | null;
    familiaHistorico: string | null;
    cpf: string | null;
    rg: string | null;
    temDadosSaude: boolean;
  }>(dadosRows)[0];

  if (!dados) return null;

  const acolhimentosRows = await db.execute(sql`
    SELECT
      ac.protocolo,
      u.nome AS "unidadeNome",
      u.tipo::text AS "unidadeTipo",
      ac.data_acolhimento AS "dataAcolhimento",
      ac.data_desacolhimento AS "dataDesacolhimento",
      ac.motivo_acolhimento AS "motivoAcolhimento",
      ac.regime::text AS regime,
      ac.ativo
    FROM acolhimentos ac
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE ac.acolhido_id = ${acolhidoId}
    ORDER BY ac.data_acolhimento DESC
  `);

  return {
    acolhidoId: dados.id,
    nomeCompleto: dados.nomeCompleto,
    nomeSocial: dados.nomeSocial,
    dataNascimento: dados.dataNascimento,
    idade: calcularIdade(dados.dataNascimento),
    nomeMae: dados.nomeMae,
    nomePai: dados.nomePai,
    cpf: dados.cpf,
    rg: dados.rg,
    familiaHistorico: dados.familiaHistorico,
    temDadosSaude: dados.temDadosSaude,
    acolhimentos: allRows<AcolhimentoJudicial>(acolhimentosRows),
  };
}

// =====================================================
// ACTION principal
// =====================================================
export async function consultarJudicialAction(
  _prevState: ConsultaJudicialState,
  formData: FormData
): Promise<ConsultaJudicialState> {
  // 1. Permissão
  const session = await getSession();
  if (!session) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }
  if (
    session.role !== 'JUDICIARIO_MP' &&
    session.role !== 'ADMIN_MUNICIPAL'
  ) {
    return {
      error:
        'Este módulo é restrito ao Poder Judiciário, Ministério Público e Administração Municipal.',
    };
  }

  // 2. Validação
  const raw = {
    tipo: formData.get('tipo'),
    termo: (formData.get('termo') ?? '').toString().trim(),
    justificativa: (formData.get('justificativa') ?? '').toString().trim(),
    processoJudicial: (formData.get('processoJudicial') ?? '').toString().trim(),
  };

  const parsed = consultaJudicialSchema.safeParse(raw);
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
  const protocoloConsulta = gerarProtocoloConsulta();
  const context = await buildContext(session);

  // 3. AUDITORIA ANTES DA BUSCA (LGPD: registrar a intenção mesmo que não haja resultado)
  try {
    await audit(context, {
      action: 'READ',
      entity: 'acolhidos',
      entityId: null,
      metadata: {
        tipo: 'CONSULTA_JUDICIAL',
        protocoloConsulta,
        tipoBusca: data.tipo,
        termo: data.termo,
        justificativa: data.justificativa,
        processoJudicial: data.processoJudicial || null,
      },
    });
  } catch (error) {
    console.error('[consultarJudicialAction] falha ao auditar:', error);
    return {
      error:
        'Não foi possível registrar a consulta na trilha de auditoria. Operação abortada por segurança.',
    };
  }

  // 4. Busca
  try {
    const ids = await buscarAcolhidos(data);

    const resultados: ResultadoJudicial[] = [];
    for (const id of ids) {
      const r = await carregarAcolhido(id);
      if (r) resultados.push(r);
    }

    return {
      protocoloConsulta,
      resultados,
      totalResultados: resultados.length,
      filtroAplicado: {
        tipo: data.tipo,
        termo: data.termo,
        justificativa: data.justificativa,
        processoJudicial: data.processoJudicial || undefined,
      },
    };
  } catch (error) {
    console.error('[consultarJudicialAction] erro na busca:', error);
    return { error: 'Erro ao executar a consulta. Tente novamente.' };
  }
}