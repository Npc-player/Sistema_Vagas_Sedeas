// src/lib/relatorios/queries.ts
// Queries agregadas para os relatórios mensais.

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

export interface Periodo {
  inicio: string; // YYYY-MM-DD
  fim: string;    // YYYY-MM-DD
}

// =====================================================
// Central de Regulação — dados por unidade
// =====================================================
export interface LinhaCentralRegulacao {
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  metaConveniada: number;
  entradas: number;
  saidas: number;
  evasoesOutros: number;
  acolhidos: number;
  permanecentes: number;
  vagasDisponiveis: number;
}

export async function getCentralRegulacao(
  periodo: Periodo,
  categoria: 'INSTITUCIONAL' | 'PROVISAO'
): Promise<LinhaCentralRegulacao[]> {
  const filtroTipo =
    categoria === 'PROVISAO'
      ? sql`u.tipo = 'CASA_PASSAGEM'::tipo_acolhimento`
      : sql`u.tipo <> 'CASA_PASSAGEM'::tipo_acolhimento`;

  const result = await db.execute(sql`
    SELECT
      u.id AS "unidadeId",
      u.nome AS "unidadeNome",
      u.tipo::text AS "unidadeTipo",
      u.capacidade_total AS "metaConveniada",

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.data_acolhimento BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
      ), 0) AS entradas,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.data_desacolhimento BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
          AND (a.motivo_desacolhimento IS NULL OR a.motivo_desacolhimento <> 'EVASAO')
      ), 0) AS saidas,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.data_desacolhimento BETWEEN ${periodo.inicio}::date AND ${periodo.fim}::date
          AND a.motivo_desacolhimento = 'EVASAO'
      ), 0) AS "evasoesOutros",

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.data_acolhimento <= ${periodo.fim}::date
          AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento > ${periodo.fim}::date)
      ), 0) AS acolhidos,

      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos a
        WHERE a.unidade_id = u.id
          AND a.data_acolhimento < ${periodo.inicio}::date
          AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento >= ${periodo.inicio}::date)
          AND (a.data_desacolhimento IS NULL OR a.data_desacolhimento > ${periodo.fim}::date)
      ), 0) AS permanecentes

    FROM unidades u
    WHERE u.ativo = true AND ${filtroTipo}
    ORDER BY u.nome ASC
  `);

  const linhas = allRows<{
    unidadeId: string;
    unidadeNome: string;
    unidadeTipo: string;
    metaConveniada: number;
    entradas: number;
    saidas: number;
    evasoesOutros: number;
    acolhidos: number;
    permanecentes: number;
  }>(result);

  return linhas.map((l) => ({
    ...l,
    vagasDisponiveis: Math.max(
      0,
      Number(l.metaConveniada) - Number(l.acolhidos)
    ),
  }));
}

// =====================================================
// Totais consolidados
// =====================================================
export interface TotaisCentralRegulacao {
  metaConveniada: number;
  entradas: number;
  saidas: number;
  evasoesOutros: number;
  acolhidos: number;
  permanecentes: number;
  vagasDisponiveis: number;
}

export function calcularTotais(
  linhas: LinhaCentralRegulacao[]
): TotaisCentralRegulacao {
  return linhas.reduce(
    (acc, l) => ({
      metaConveniada: acc.metaConveniada + l.metaConveniada,
      entradas: acc.entradas + l.entradas,
      saidas: acc.saidas + l.saidas,
      evasoesOutros: acc.evasoesOutros + l.evasoesOutros,
      acolhidos: acc.acolhidos + l.acolhidos,
      permanecentes: acc.permanecentes + l.permanecentes,
      vagasDisponiveis: acc.vagasDisponiveis + l.vagasDisponiveis,
    }),
    {
      metaConveniada: 0,
      entradas: 0,
      saidas: 0,
      evasoesOutros: 0,
      acolhidos: 0,
      permanecentes: 0,
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
    return {
      inicio: formatarData(inicio),
      fim: formatarData(fim),
    };
  }

  if (tipo === 'TRIMESTRAL') {
    const trimestre = Math.floor(base.getMonth() / 3);
    const inicio = new Date(base.getFullYear(), trimestre * 3, 1);
    const fim = new Date(base.getFullYear(), trimestre * 3 + 3, 0);
    return {
      inicio: formatarData(inicio),
      fim: formatarData(fim),
    };
  }

  // MENSAL
  const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return {
    inicio: formatarData(inicio),
    fim: formatarData(fim),
  };
}

function formatarData(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// =====================================================
// Fluxo Mensal Detalhado — lista nominal
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
  const documentos = new Map<string, { cpf: string | null; rg: string | null }>();

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
          documentos.set(acolhidoId, {
            cpf: doc.cpf,
            rg: doc.rg,
          });
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