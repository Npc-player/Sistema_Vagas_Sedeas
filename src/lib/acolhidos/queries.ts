// src/lib/acolhidos/queries.ts
// Queries para a listagem de pessoas acolhidas (com e sem acolhimento ativo).

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

// =====================================================
// Em acolhimento (com vínculo ativo)
// =====================================================
export interface PessoaEmAcolhimento {
  acolhimentoId: string;
  protocolo: string;
  acolhidoId: string;
  nomeCompleto: string;
  nomeSocial: string | null;
  dataNascimento: string;
  idade: number;
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  numeroVaga: number | null;
  dataAcolhimento: string;
  regime: string;
}

export async function listarEmAcolhimento(): Promise<PessoaEmAcolhimento[]> {
  const result = await db.execute(sql`
    SELECT
      ac.id AS "acolhimentoId",
      ac.protocolo,
      a.id AS "acolhidoId",
      a.nome_completo AS "nomeCompleto",
      a.nome_social AS "nomeSocial",
      a.data_nascimento AS "dataNascimento",
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento))::int AS idade,
      u.id AS "unidadeId",
      u.nome AS "unidadeNome",
      u.tipo::text AS "unidadeTipo",
      v.numero_leito AS "numeroVaga",
      ac.data_acolhimento AS "dataAcolhimento",
      ac.regime::text AS regime
    FROM acolhimentos ac
    INNER JOIN acolhidos a ON a.id = ac.acolhido_id
    INNER JOIN unidades u ON u.id = ac.unidade_id
    LEFT JOIN vagas v ON v.acolhimento_atual_id = ac.id
    WHERE ac.ativo = true
    ORDER BY a.nome_completo ASC
  `);
  return allRows<PessoaEmAcolhimento>(result);
}

// =====================================================
// Sem acolhimento
// =====================================================
export interface PessoaSemAcolhimento {
  id: string;
  nomeCompleto: string;
  nomeSocial: string | null;
  dataNascimento: string;
  idade: number;
  nomeMae: string | null;
  nomePai: string | null;
  grupoFamiliar: string | null;
  createdAt: string;
  totalAcolhimentosAnteriores: number;
}

export async function listarSemAcolhimento(): Promise<PessoaSemAcolhimento[]> {
  const result = await db.execute(sql`
    SELECT
      a.id,
      a.nome_completo AS "nomeCompleto",
      a.nome_social AS "nomeSocial",
      a.data_nascimento AS "dataNascimento",
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento))::int AS idade,
      a.nome_mae AS "nomeMae",
      a.nome_pai AS "nomePai",
      a.grupo_familiar AS "grupoFamiliar",
      a.created_at AS "createdAt",
      COALESCE((
        SELECT COUNT(*)::int FROM acolhimentos ac
        WHERE ac.acolhido_id = a.id
      ), 0) AS "totalAcolhimentosAnteriores"
    FROM acolhidos a
    WHERE NOT EXISTS (
      SELECT 1 FROM acolhimentos ac
      WHERE ac.acolhido_id = a.id AND ac.ativo = true
    )
    ORDER BY a.nome_completo ASC
  `);
  return allRows<PessoaSemAcolhimento>(result);
}