// src/lib/acolhidos/queries.ts
// Queries para listagem de pessoas acolhidas, com filtros.

import { sql, type SQL } from 'drizzle-orm';
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
// Filtros
// =====================================================
export interface FiltrosAcolhidos {
  nome?: string;
  cpf?: string;
  medidaProtetiva?: string;
}

function getSecret(): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) throw new Error('FIELD_ENCRYPTION_KEY não configurada');
  return secret;
}

function normalizarCpf(cpf: string | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

/**
 * Monta condições SQL comuns aos dois modos (em acolhimento / sem acolhimento).
 * Retorna uma lista de SQL e, se houver CPF, o hash correspondente.
 */
async function montarFiltrosComuns(
  filtros: FiltrosAcolhidos,
  aliasAcolhido: string = 'a'
): Promise<SQL[]> {
  const conds: SQL[] = [];

  if (filtros.nome && filtros.nome.trim()) {
    const termo = `%${filtros.nome.trim()}%`;
    conds.push(
      sql`(${sql.raw(aliasAcolhido)}.nome_completo ILIKE ${termo} OR ${sql.raw(aliasAcolhido)}.nome_social ILIKE ${termo})`
    );
  }

  if (filtros.cpf && filtros.cpf.trim()) {
    const cpfLimpo = normalizarCpf(filtros.cpf);
    if (cpfLimpo.length === 11) {
      const secret = getSecret();
      // Busca o acolhido pelo hash HMAC correspondente
      const hashRows = await db.execute(sql`
        SELECT private.hmac_value(${cpfLimpo}, ${secret}) AS hash
      `);
      const hash = allRows<{ hash: string }>(hashRows)[0]?.hash;
      if (hash) {
        conds.push(sql`${sql.raw(aliasAcolhido)}.cpf_hash = ${hash}`);
      } else {
        // CPF inválido — força resultado vazio
        conds.push(sql`FALSE`);
      }
    } else if (cpfLimpo.length > 0) {
      // CPF incompleto — força resultado vazio
      conds.push(sql`FALSE`);
    }
  }

  return conds;
}

function montarWhere(conds: SQL[]): SQL {
  if (conds.length === 0) return sql``;
  return sql`${sql.join(conds, sql` AND `)} AND `;
}

// =====================================================
// Em acolhimento
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

export async function listarEmAcolhimento(
  filtros: FiltrosAcolhidos = {}
): Promise<PessoaEmAcolhimento[]> {
  const conds = await montarFiltrosComuns(filtros, 'a');

  if (filtros.medidaProtetiva && filtros.medidaProtetiva.trim()) {
    const termo = `%${filtros.medidaProtetiva.trim()}%`;
    conds.push(sql`ac.numero_medida_protetiva ILIKE ${termo}`);
  }

  const whereExtra = montarWhere(conds);

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
    WHERE ${whereExtra} ac.ativo = true
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

export async function listarSemAcolhimento(
  filtros: FiltrosAcolhidos = {}
): Promise<PessoaSemAcolhimento[]> {
  const conds = await montarFiltrosComuns(filtros, 'a');

  // Medida protetiva não se aplica a quem não tem acolhimento — se filtro informado, retorna vazio
  if (filtros.medidaProtetiva && filtros.medidaProtetiva.trim()) {
    return [];
  }

  const whereExtra = montarWhere(conds);

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
        SELECT COUNT(*)::int FROM acolhimentos ac2
        WHERE ac2.acolhido_id = a.id
      ), 0) AS "totalAcolhimentosAnteriores"
    FROM acolhidos a
    WHERE ${whereExtra} NOT EXISTS (
      SELECT 1 FROM acolhimentos ac
      WHERE ac.acolhido_id = a.id AND ac.ativo = true
    )
    ORDER BY a.nome_completo ASC
  `);
  return allRows<PessoaSemAcolhimento>(result);
}