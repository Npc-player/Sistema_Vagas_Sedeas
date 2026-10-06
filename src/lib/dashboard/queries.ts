// src/lib/dashboard/queries.ts
// Queries agregadas para o dashboard, com suporte a filtros de tipo/unidade.

import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import type { FiltrosDashboard } from './filtros';

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

/**
 * Constrói a cláusula WHERE para filtrar acolhimentos via unidades.
 * Uso em queries onde a tabela principal não é a `unidades`.
 */
function filtroAcolhimentoUnidade(
  f: FiltrosDashboard,
  aliasUnidade: string = 'u'
): SQL {
  const conds: SQL[] = [sql.raw(`${aliasUnidade}.ativo = true`)];
  if (f.tipo) {
    conds.push(
      sql`${sql.raw(aliasUnidade)}.tipo = ${f.tipo}::tipo_acolhimento`
    );
  }
  if (f.unidadeId) {
    conds.push(sql`${sql.raw(aliasUnidade)}.id = ${f.unidadeId}`);
  }
  return sql.join(conds, sql` AND `);
}

// =====================================================
// Totais gerais
// =====================================================
export interface TotaisGerais {
  capacidadeTotal: number;
  disponiveis: number;
  ocupadas: number;
  bloqueadas: number;
  reservadas: number;
  taxaOcupacao: number;
  acolhimentosAtivos: number;
}

export async function getTotaisGerais(
  filtros: FiltrosDashboard = {}
): Promise<TotaisGerais> {
  const whereUnidade = filtroAcolhimentoUnidade(filtros, 'u');

  // Vagas filtradas por unidade (que por sua vez é filtrada por tipo)
  const vagasResult = await db.execute(sql`
    SELECT
      COUNT(v.id)::int AS capacidade_total,
      COUNT(v.id) FILTER (WHERE v.status = 'DISPONIVEL')::int AS disponiveis,
      COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::int AS ocupadas,
      COUNT(v.id) FILTER (WHERE v.status = 'BLOQUEADA')::int AS bloqueadas,
      COUNT(v.id) FILTER (WHERE v.status = 'RESERVADA')::int AS reservadas
    FROM vagas v
    INNER JOIN unidades u ON u.id = v.unidade_id
    WHERE ${whereUnidade}
  `);

  // Acolhimentos ativos filtrados por unidade
  const ativosResult = await db.execute(sql`
    SELECT COUNT(ac.id)::int AS total
    FROM acolhimentos ac
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE ac.ativo = true AND ${whereUnidade}
  `);

  const vagasRow = firstRow<{
    capacidade_total: number;
    disponiveis: number;
    ocupadas: number;
    bloqueadas: number;
    reservadas: number;
  }>(vagasResult);

  const ativosRow = firstRow<{ total: number }>(ativosResult);

  const capacidadeTotal = Number(vagasRow?.capacidade_total ?? 0);
  const ocupadas = Number(vagasRow?.ocupadas ?? 0);

  return {
    capacidadeTotal,
    disponiveis: Number(vagasRow?.disponiveis ?? 0),
    ocupadas,
    bloqueadas: Number(vagasRow?.bloqueadas ?? 0),
    reservadas: Number(vagasRow?.reservadas ?? 0),
    taxaOcupacao:
      capacidadeTotal > 0 ? Math.round((ocupadas / capacidadeTotal) * 100) : 0,
    acolhimentosAtivos: Number(ativosRow?.total ?? 0),
  };
}

// =====================================================
// Distribuição por tipo de serviço
// =====================================================
export interface DadosPorTipo {
  tipo: string;
  total: number;
  ocupadas: number;
  disponiveis: number;
  taxa: number;
}

export async function getDistribuicaoPorTipo(
  filtros: FiltrosDashboard = {}
): Promise<DadosPorTipo[]> {
  const whereUnidade = filtroAcolhimentoUnidade(filtros, 'u');

  const result = await db.execute(sql`
    SELECT
      u.tipo::text AS tipo,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::int AS ocupadas,
      COUNT(v.id) FILTER (WHERE v.status = 'DISPONIVEL')::int AS disponiveis
    FROM unidades u
    LEFT JOIN vagas v ON v.unidade_id = u.id
    WHERE ${whereUnidade}
    GROUP BY u.tipo
    ORDER BY u.tipo
  `);

  const rows = allRows<{
    tipo: string;
    total: number;
    ocupadas: number;
    disponiveis: number;
  }>(result);

  return rows.map((r) => ({
    tipo: r.tipo,
    total: Number(r.total),
    ocupadas: Number(r.ocupadas),
    disponiveis: Number(r.disponiveis),
    taxa:
      Number(r.total) > 0
        ? Math.round((Number(r.ocupadas) / Number(r.total)) * 100)
        : 0,
  }));
}

// =====================================================
// Fluxo de movimentação (últimos 12 meses)
// =====================================================
export interface FluxoMes {
  mes: string;
  label: string;
  entradas: number;
  saidas: number;
}

export async function getFluxo12Meses(
  filtros: FiltrosDashboard = {}
): Promise<FluxoMes[]> {
  const whereUnidade = filtroAcolhimentoUnidade(filtros, 'u');

  const result = await db.execute(sql`
    WITH meses AS (
      SELECT date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
             + (n || ' months')::interval AS mes
      FROM generate_series(0, 11) AS n
    ),
    entradas AS (
      SELECT
        date_trunc('month', a.data_acolhimento) AS mes,
        COUNT(*)::int AS total
      FROM acolhimentos a
      INNER JOIN unidades u ON u.id = a.unidade_id
      WHERE a.data_acolhimento >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
        AND ${whereUnidade}
      GROUP BY date_trunc('month', a.data_acolhimento)
    ),
    saidas AS (
      SELECT
        date_trunc('month', a.data_desacolhimento) AS mes,
        COUNT(*)::int AS total
      FROM acolhimentos a
      INNER JOIN unidades u ON u.id = a.unidade_id
      WHERE a.data_desacolhimento IS NOT NULL
        AND a.data_desacolhimento >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
        AND ${whereUnidade}
      GROUP BY date_trunc('month', a.data_desacolhimento)
    )
    SELECT
      to_char(m.mes, 'YYYY-MM') AS mes,
      to_char(m.mes, 'TMMon/YY') AS label,
      COALESCE(e.total, 0) AS entradas,
      COALESCE(s.total, 0) AS saidas
    FROM meses m
    LEFT JOIN entradas e ON e.mes = m.mes
    LEFT JOIN saidas s ON s.mes = m.mes
    ORDER BY m.mes
  `);

  const rows = allRows<{
    mes: string;
    label: string;
    entradas: number;
    saidas: number;
  }>(result);

  return rows.map((r) => ({
    mes: r.mes,
    label: r.label,
    entradas: Number(r.entradas),
    saidas: Number(r.saidas),
  }));
}

// =====================================================
// Unidades em alerta (ocupação >= 95%)
// =====================================================
export interface UnidadeAlerta {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  total: number;
  ocupadas: number;
  taxa: number;
}

export async function getUnidadesEmAlerta(
  filtros: FiltrosDashboard = {}
): Promise<UnidadeAlerta[]> {
  const whereUnidade = filtroAcolhimentoUnidade(filtros, 'u');

  const result = await db.execute(sql`
    SELECT
      u.id,
      u.nome,
      u.tipo::text AS tipo,
      u.cidade,
      u.uf,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::int AS ocupadas
    FROM unidades u
    INNER JOIN vagas v ON v.unidade_id = u.id
    WHERE ${whereUnidade}
    GROUP BY u.id, u.nome, u.tipo, u.cidade, u.uf
    HAVING COUNT(v.id) > 0
       AND (COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::float / COUNT(v.id)) >= 0.95
    ORDER BY (COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::float / COUNT(v.id)) DESC
  `);

  const rows = allRows<{
    id: string;
    nome: string;
    tipo: string;
    cidade: string;
    uf: string;
    total: number;
    ocupadas: number;
  }>(result);

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    tipo: r.tipo,
    cidade: r.cidade,
    uf: r.uf,
    total: Number(r.total),
    ocupadas: Number(r.ocupadas),
    taxa:
      Number(r.total) > 0
        ? Math.round((Number(r.ocupadas) / Number(r.total)) * 100)
        : 0,
  }));
}

// =====================================================
// Tempo médio de permanência (dias)
// =====================================================
export async function getTempoMedioPermanencia(
  filtros: FiltrosDashboard = {}
): Promise<number | null> {
  const whereUnidade = filtroAcolhimentoUnidade(filtros, 'u');

  const result = await db.execute(sql`
    SELECT
      ROUND(AVG(ac.data_desacolhimento - ac.data_acolhimento))::int AS media
    FROM acolhimentos ac
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE ac.data_desacolhimento IS NOT NULL
      AND ac.data_desacolhimento >= ac.data_acolhimento
      AND ${whereUnidade}
  `);

  const row = firstRow<{ media: number | null }>(result);
  if (!row || row.media === null || row.media === undefined) return null;
  return Number(row.media);
}

// =====================================================
// Lista de unidades (para o filtro)
// =====================================================
export interface UnidadeParaFiltro {
  id: string;
  nome: string;
  tipo: string;
}

export async function getUnidadesParaFiltro(): Promise<UnidadeParaFiltro[]> {
  const result = await db.execute(sql`
    SELECT id, nome, tipo::text AS tipo
    FROM unidades
    WHERE ativo = true
    ORDER BY tipo, nome
  `);
  return allRows<UnidadeParaFiltro>(result);
}