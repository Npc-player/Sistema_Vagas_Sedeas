// src/lib/relatorios/queries.ts
// Queries agregadas para os relatórios mensais.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

export interface Periodo {
  inicio: string;
  fim: string;
}

// =====================================================
// Central de Regulação (nova estrutura: 2 linhas por unidade)
// =====================================================
export interface LinhaCentralRegulacao {
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  tipoVaga: 'PROVISORIO' | 'DEFINITIVO';
  meta: number | null;
  entradas: number;
  saidas: number;
  evasoesOutros: number;
  acolhidos: number;
  fixos: number;
  vagasDisponiveis: number | null;
}

export async function getCentralRegulacao(
  periodo: Periodo
): Promise<LinhaCentralRegulacao[]> {
  const result = await db.execute(sql`
    SELECT
      u.id AS "unidadeId",
      u.nome AS "unidadeNome",
      u.tipo::text AS "unidadeTipo",
      r.regime::text AS "tipoVaga",

      CASE WHEN r.regime = 'PROVISORIO' THEN u.capacidade_total ELSE NULL END AS meta,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.regime = r.regime
          AND a.data_acolhimento BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
      ), 0) AS entradas,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.regime = r.regime
          AND a.data_desacolhimento BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
          AND a.situacao_especial IS NULL
      ), 0) AS saidas,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.regime = r.regime
          AND a.situacao_especial IS NOT NULL
          AND a.situacao_especial_em BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
      ), 0) AS "evasoesOutros",

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.regime = r.regime
          AND a.data_acolhimento <= ${periodo.fim}::date
          AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento > ${periodo.fim}::date)
      ), 0) AS acolhidos,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.regime = r.regime
          AND a.data_acolhimento < ${periodo.inicio}::date
          AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento > ${periodo.fim}::date)
      ), 0) AS fixos,

      CASE WHEN r.regime = 'PROVISORIO' THEN (
        u.capacidade_total - COALESCE((
          SELECT COUNT(*)::int FROM acolhimentos a
          WHERE a.unidade_id = u.id
            AND a.data_acolhimento <= ${periodo.fim}::date
            AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento > ${periodo.fim}::date)
        ), 0)
      ) ELSE NULL END AS "vagasDisponiveis"

    FROM unidades u
    CROSS JOIN (
      VALUES
        ('PROVISORIO'::regime_acolhimento),
        ('DEFINITIVO'::regime_acolhimento)
    ) AS r(regime)
    WHERE u.ativo = true
    ORDER BY
      u.nome ASC,
      CASE r.regime WHEN 'PROVISORIO' THEN 1 WHEN 'DEFINITIVO' THEN 2 END
  `);

  return allRows<LinhaCentralRegulacao>(result);
}

export interface TotaisCentralRegulacao {
  meta: number;
  entradas: number;
  saidas: number;
  evasoesOutros: number;
  acolhidos: number;
  fixos: number;
  vagasDisponiveis: number;
}

export function calcularTotais(
  linhas: LinhaCentralRegulacao[]
): TotaisCentralRegulacao {
  return linhas.reduce(
    (acc, l) => ({
      meta: acc.meta + (l.meta ?? 0),
      entradas: acc.entradas + l.entradas,
      saidas: acc.saidas + l.saidas,
      evasoesOutros: acc.evasoesOutros + l.evasoesOutros,
      acolhidos: acc.acolhidos + l.acolhidos,
      fixos: acc.fixos + l.fixos,
      vagasDisponiveis: acc.vagasDisponiveis + (l.vagasDisponiveis ?? 0),
    }),
    {
      meta: 0,
      entradas: 0,
      saidas: 0,
      evasoesOutros: 0,
      acolhidos: 0,
      fixos: 0,
      vagasDisponiveis: 0,
    }
  );
}

// =====================================================
// Helpers de período
// =====================================================
export type TipoPeriodo = 'MENSAL' | 'TRIMESTRAL' | 'ANUAL' | 'PERSONALIZADO';

export function calcularPeriodo(
  tipo: TipoPeriodo,
  dataBase: string,
  dataInicio?: string,
  dataFim?: string
): Periodo {
  if (tipo === 'PERSONALIZADO' && dataInicio && dataFim) {
    return { inicio: dataInicio, fim: dataFim };
  }

  const base = new Date(dataBase + 'T00:00:00');

  if (tipo === 'ANUAL') {
    const inicio = new Date(base.getFullYear(), 0, 1);
    const fim = new Date(base.getFullYear(), 11, 31);
    return { inicio: formatarData(inicio), fim: formatarData(fim) };
  }

  if (tipo === 'TRIMESTRAL') {
    const trimestre = Math.floor(base.getMonth() / 3);
    const inicio = new Date(base.getFullYear(), trimestre * 3, 1);
    const fim = new Date(base.getFullYear(), trimestre * 3 + 3, 0);
    return { inicio: formatarData(inicio), fim: formatarData(fim) };
  }

  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { inicio: formatarData(inicio), fim: formatarData(fim) };
}

function formatarData(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// =====================================================
// Fluxo Detalhado
// =====================================================
export interface LinhaFluxoDetalhado {
  acolhimentoId: string;
  protocolo: string;
  grupoFamiliar: string | null;

  acolhidoId: string;
  nomeCompleto: string;
  nomeSocial: string | null;
  dataNascimento: string;
  idade: number;
  nomeMae: string | null;
  nomePai: string | null;

  dataAcolhimento: string;
  motivo: string;
  regime: string;

  cpf: string | null;
  rg: string | null;

  numeroProcesso: string | null;
  numeroMedidaProtetiva: string | null;
  numeroGuiaAcolhimento: string | null;
  territorio: string | null;

  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;

  asVaraInfancia: string | null;
  psicVaraInfancia: string | null;
  asCreas: string | null;

  situacaoEspecial: string | null;
  situacaoOutrosDetalhe: string | null;

  dataDesacolhimento: string | null;
  motivoDesacolhimento: string | null;
  ativo: boolean;
}

export async function getFluxoDetalhado(
  periodo: Periodo,
  unidadeId?: string
): Promise<LinhaFluxoDetalhado[]> {
  const filtroUnidade = unidadeId
    ? sql`AND ac.unidade_id = ${unidadeId}`
    : sql``;

  const result = await db.execute(sql`
    SELECT
      ac.id AS "acolhimentoId",
      ac.protocolo,
      a.grupo_familiar AS "grupoFamiliar",

      a.id AS "acolhidoId",
      a.nome_completo AS "nomeCompleto",
      a.nome_social AS "nomeSocial",
      a.data_nascimento AS "dataNascimento",
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento))::int AS idade,
      a.nome_mae AS "nomeMae",
      a.nome_pai AS "nomePai",

      ac.data_acolhimento AS "dataAcolhimento",
      ac.motivo_acolhimento AS motivo,
      ac.regime::text AS regime,

      ac.numero_processo AS "numeroProcesso",
      ac.numero_medida_protetiva AS "numeroMedidaProtetiva",
      ac.numero_guia_acolhimento AS "numeroGuiaAcolhimento",
      ac.territorio,

      u.id AS "unidadeId",
      u.nome AS "unidadeNome",
      u.tipo::text AS "unidadeTipo",

      COALESCE(ac.as_vara_infancia, u.as_vara_infancia) AS "asVaraInfancia",
      COALESCE(ac.psic_vara_infancia, u.psic_vara_infancia) AS "psicVaraInfancia",
      COALESCE(ac.as_creas, u.as_creas) AS "asCreas",

      ac.situacao_especial::text AS "situacaoEspecial",
      ac.situacao_outros_detalhe AS "situacaoOutrosDetalhe",

      ac.data_desacolhimento AS "dataDesacolhimento",
      ac.motivo_desacolhimento::text AS "motivoDesacolhimento",
      ac.ativo
    FROM acolhimentos ac
    INNER JOIN acolhidos a ON a.id = ac.acolhido_id
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE (
      ac.data_acolhimento <= ${periodo.fim}::date
        AND (ac.data_desacolhimento IS NULL OR ac.data_desacolhimento >= ${periodo.inicio}::date)
    )
    ${filtroUnidade}
    ORDER BY
      a.grupo_familiar NULLS LAST,
      a.nome_completo ASC
  `);

  const linhas = allRows<Omit<LinhaFluxoDetalhado, 'cpf' | 'rg'>>(result);

  const ids = linhas.map((l) => l.acolhidoId);
  const documentos = new Map<
    string,
    { cpf: string | null; rg: string | null }
  >();

  if (ids.length > 0) {
    const secret = process.env.FIELD_ENCRYPTION_KEY;
    if (!secret) throw new Error('FIELD_ENCRYPTION_KEY não configurada');

    for (const acolhidoId of ids) {
      try {
        const docResult = await db.execute(sql`
          SELECT
            private.decrypt_text(cpf_encrypted, ${secret}) AS cpf,
            private.decrypt_text(rg_encrypted, ${secret}) AS rg
          FROM acolhidos
          WHERE id = ${acolhidoId}
          LIMIT 1
        `);
        const doc = allRows<{ cpf: string | null; rg: string | null }>(
          docResult
        )[0];
        if (doc) {
          documentos.set(acolhidoId, { cpf: doc.cpf, rg: doc.rg });
        }
      } catch (error) {
        console.error('[getFluxoDetalhado] erro ao descriptografar:', error);
      }
    }
  }

  return linhas.map((l) => ({
    ...l,
    cpf: documentos.get(l.acolhidoId)?.cpf ?? null,
    rg: documentos.get(l.acolhidoId)?.rg ?? null,
  }));
}