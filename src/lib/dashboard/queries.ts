// src/lib/dashboard/queries.ts
// Queries agregadas para o dashboard.
// Usam Drizzle (bypassa RLS) porque são leituras agregadas e
// o RBAC já foi validado antes. Nunca retornam dados nominais.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

// =====================================================
// Helpers de extração (robustos a diferentes formatos do driver)
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

export async function getTotaisGerais(): Promise<TotaisGerais> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM vagas) AS capacidade_total,
      (SELECT COUNT(*)::int FROM vagas WHERE status = 'DISPONIVEL') AS disponiveis,
      (SELECT COUNT(*)::int FROM vagas WHERE status = 'OCUPADA') AS ocupadas,
      (SELECT COUNT(*)::int FROM vagas WHERE status = 'BLOQUEADA') AS bloqueadas,
      (SELECT COUNT(*)::int FROM vagas WHERE status = 'RESERVADA') AS reservadas,
      (SELECT COUNT(*)::int FROM acolhimentos WHERE ativo = true) AS acolhimentos_ativos
  `);

  const row = firstRow<{
    capacidade_total: number | string;
    disponiveis: number | string;
    ocupadas: number | string;
    bloqueadas: number | string;
    reservadas: number | string;
    acolhimentos_ativos: number | string;
  }>(result);

  const capacidadeTotal = Number(row?.capacidade_total ?? 0);
  const ocupadas = Number(row?.ocupadas ?? 0);

  return {
    capacidadeTotal,
    disponiveis: Number(row?.disponiveis ?? 0),
    ocupadas,
    bloqueadas: Number(row?.bloqueadas ?? 0),
    reservadas: Number(row?.reservadas ?? 0),
    taxaOcupacao:
      capacidadeTotal > 0 ? Math.round((ocupadas / capacidadeTotal) * 100) : 0,
    acolhimentosAtivos: Number(row?.acolhimentos_ativos ?? 0),
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

export async function getDistribuicaoPorTipo(): Promise<DadosPorTipo[]> {
  const result = await db.execute(sql`
    SELECT
      u.tipo,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::int AS ocupadas,
      COUNT(v.id) FILTER (WHERE v.status = 'DISPONIVEL')::int AS disponiveis
    FROM unidades u
    LEFT JOIN vagas v ON v.unidade_id = u.id
    WHERE u.ativo = true
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

export async function getFluxo12Meses(): Promise<FluxoMes[]> {
  const result = await db.execute(sql`
    WITH meses AS (
      SELECT date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
             + (n || ' months')::interval AS mes
      FROM generate_series(0, 11) AS n
    )
    SELECT
      to_char(m.mes, 'YYYY-MM') AS mes,
      to_char(m.mes, 'TMMon/YY') AS label,
      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE date_trunc('month', a.data_acolhimento) = m.mes
      ), 0) AS entradas,
      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.data_desacolhimento IS NOT NULL
          AND date_trunc('month', a.data_desacolhimento) = m.mes
      ), 0) AS saidas
    FROM meses m
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

export async function getUnidadesEmAlerta(): Promise<UnidadeAlerta[]> {
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.nome,
      u.tipo,
      u.cidade,
      u.uf,
      COUNT(v.id)::int AS total,
      COUNT(v.id) FILTER (WHERE v.status = 'OCUPADA')::int AS ocupadas
    FROM unidades u
    INNER JOIN vagas v ON v.unidade_id = u.id
    WHERE u.ativo = true
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
export async function getTempoMedioPermanencia(): Promise<number | null> {
  const result = await db.execute(sql`
    SELECT
      ROUND(AVG(data_desacolhimento - data_acolhimento))::int AS media
    FROM acolhimentos
    WHERE data_desacolhimento IS NOT NULL
      AND data_desacolhimento >= data_acolhimento
  `);

  const row = firstRow<{ media: number | null }>(result);
  if (!row || row.media === null || row.media === undefined) return null;
  return Number(row.media);
}