// src/lib/rbac/queries.ts
// Queries de leitura de usuários (profiles + auth.users).
// Usa Drizzle — o RBAC é validado antes de chamar.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export interface UsuarioRow {
  id: string;
  email: string;
  nomeCompleto: string;
  role: string;
  unidadeId: string | null;
  unidadeNome: string | null;
  ativo: boolean;
  createdAt: string;
  ultimoLogin: string | null;
}

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

export async function listarUsuarios(): Promise<UsuarioRow[]> {
  const result = await db.execute(sql`
    SELECT
      p.id,
      u.email,
      p.nome_completo AS "nomeCompleto",
      p.role::text AS role,
      p.unidade_id AS "unidadeId",
      un.nome AS "unidadeNome",
      p.ativo,
      p.created_at AS "createdAt",
      u.last_sign_in_at AS "ultimoLogin"
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
    LEFT JOIN unidades un ON un.id = p.unidade_id
    ORDER BY p.ativo DESC, p.nome_completo ASC
  `);
  return allRows<UsuarioRow>(result);
}

export async function buscarUsuarioPorId(
  id: string
): Promise<UsuarioRow | null> {
  const result = await db.execute(sql`
    SELECT
      p.id,
      u.email,
      p.nome_completo AS "nomeCompleto",
      p.role::text AS role,
      p.unidade_id AS "unidadeId",
      un.nome AS "unidadeNome",
      p.ativo,
      p.created_at AS "createdAt",
      u.last_sign_in_at AS "ultimoLogin"
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
    LEFT JOIN unidades un ON un.id = p.unidade_id
    WHERE p.id = ${id}
    LIMIT 1
  `);
  return firstRow<UsuarioRow>(result);
}

export async function listarUnidadesParaSelect(): Promise<
  Array<{ id: string; nome: string; tipo: string }>
> {
  const result = await db.execute(sql`
    SELECT id, nome, tipo::text AS tipo
    FROM unidades
    WHERE ativo = true
    ORDER BY nome ASC
  `);
  return allRows<{ id: string; nome: string; tipo: string }>(result);
}