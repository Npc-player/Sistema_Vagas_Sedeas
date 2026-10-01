// src/lib/dpo/queries.ts
// Queries do módulo DPO (LGPD Art. 41).
// Leitura via Drizzle — RBAC validado antes de chamar.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

// =====================================================
// Helpers
// =====================================================
function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

function firstRow<T>(result: unknown): T | null {
  const rows = allRows<T>(result);
  return rows.length > 0 ? rows[0] : null;
}

// =====================================================
// Configuração do DPO
// =====================================================
export interface DpoConfiguracao {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  cargo: string | null;
  endereco: string | null;
  horarioAtendimento: string | null;
  observacoes: string | null;
  ativo: boolean;
  updatedAt: string;
}

export async function getDpoConfiguracao(): Promise<DpoConfiguracao | null> {
  const result = await db.execute(sql`
    SELECT
      id,
      nome_completo AS "nomeCompleto",
      email,
      telefone,
      cargo,
      endereco,
      horario_atendimento AS "horarioAtendimento",
      observacoes,
      ativo,
      updated_at AS "updatedAt"
    FROM dpo_configuracao
    WHERE ativo = true
    LIMIT 1
  `);
  return firstRow<DpoConfiguracao>(result);
}

// =====================================================
// Requisições LGPD
// =====================================================
export interface RequisicaoLgpd {
  id: string;
  protocolo: string;
  tipo: string;
  status: string;
  requerenteNome: string;
  requerenteEmail: string;
  requerenteTelefone: string | null;
  descricao: string;
  resposta: string | null;
  respondidoEm: string | null;
  prazoResposta: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FiltrosRequisicao {
  status?: string;
  tipo?: string;
  pagina?: number;
  porPagina?: number;
}

export interface ResultadoRequisicoes {
  registros: RequisicaoLgpd[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export async function listarRequisicoes(
  filtros: FiltrosRequisicao = {}
): Promise<ResultadoRequisicoes> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(10, filtros.porPagina ?? 30));
  const offset = (pagina - 1) * porPagina;

  const condicoes = [];
  if (filtros.status) {
    condicoes.push(sql`status = ${filtros.status}::lgpd_requisicao_status`);
  }
  if (filtros.tipo) {
    condicoes.push(sql`tipo = ${filtros.tipo}::lgpd_tipo_requisicao`);
  }

  let whereClause = sql``;
  if (condicoes.length > 0) {
    whereClause = sql`WHERE `;
    condicoes.forEach((c, i) => {
      if (i > 0) whereClause = sql`${whereClause} AND `;
      whereClause = sql`${whereClause}${c}`;
    });
  }

  const result = await db.execute(sql`
    SELECT
      id,
      protocolo,
      tipo::text AS tipo,
      status::text AS status,
      requerente_nome AS "requerenteNome",
      requerente_email AS "requerenteEmail",
      requerente_telefone AS "requerenteTelefone",
      descricao,
      resposta,
      respondido_em AS "respondidoEm",
      prazo_resposta AS "prazoResposta",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM lgpd_requisicoes
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'RECEBIDA' THEN 1
        WHEN 'EM_ANALISE' THEN 2
        WHEN 'RESPONDIDA' THEN 3
        WHEN 'ARQUIVADA' THEN 4
      END,
      created_at DESC
    LIMIT ${porPagina}
    OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM lgpd_requisicoes
    ${whereClause}
  `);

  const registros = allRows<RequisicaoLgpd>(result);
  const total = Number(firstRow<{ total: number }>(countResult)?.total ?? 0);

  return {
    registros,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function buscarRequisicaoPorId(
  id: string
): Promise<RequisicaoLgpd | null> {
  const result = await db.execute(sql`
    SELECT
      id,
      protocolo,
      tipo::text AS tipo,
      status::text AS status,
      requerente_nome AS "requerenteNome",
      requerente_email AS "requerenteEmail",
      requerente_telefone AS "requerenteTelefone",
      descricao,
      resposta,
      respondido_em AS "respondidoEm",
      prazo_resposta AS "prazoResposta",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM lgpd_requisicoes
    WHERE id = ${id}
    LIMIT 1
  `);
  return firstRow<RequisicaoLgpd>(result);
}

// =====================================================
// Contadores para o painel
// =====================================================
export interface ContadoresRequisicoes {
  total: number;
  recebidas: number;
  emAnalise: number;
  respondidas: number;
  arquivadas: number;
  vencendo: number; // com prazo nos próximos 5 dias
}

export async function getContadoresRequisicoes(): Promise<ContadoresRequisicoes> {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'RECEBIDA')::int AS recebidas,
      COUNT(*) FILTER (WHERE status = 'EM_ANALISE')::int AS "emAnalise",
      COUNT(*) FILTER (WHERE status = 'RESPONDIDA')::int AS respondidas,
      COUNT(*) FILTER (WHERE status = 'ARQUIVADA')::int AS arquivadas,
      COUNT(*) FILTER (
        WHERE status IN ('RECEBIDA', 'EM_ANALISE')
          AND prazo_resposta IS NOT NULL
          AND prazo_resposta <= CURRENT_DATE + INTERVAL '5 days'
      )::int AS vencendo
    FROM lgpd_requisicoes
  `);

  const row = firstRow<{
    total: number;
    recebidas: number;
    emAnalise: number;
    respondidas: number;
    arquivadas: number;
    vencendo: number;
  }>(result);

  return {
    total: Number(row?.total ?? 0),
    recebidas: Number(row?.recebidas ?? 0),
    emAnalise: Number(row?.emAnalise ?? 0),
    respondidas: Number(row?.respondidas ?? 0),
    arquivadas: Number(row?.arquivadas ?? 0),
    vencendo: Number(row?.vencendo ?? 0),
  };
}