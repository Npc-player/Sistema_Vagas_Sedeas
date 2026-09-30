// src/lib/audit/queries.ts
// Queries de leitura do audit_log.
// Usa Drizzle (bypassa RLS) — o RBAC é validado antes de chamar.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export interface FiltrosAuditoria {
  userId?: string;
  action?: string;
  entity?: string;
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  pagina?: number;
  porPagina?: number;
}

export interface AuditLogRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
}

export interface ResultadoAuditoria {
  registros: AuditLogRow[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// Helper robusto
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

export async function listarAuditoria(
  filtros: FiltrosAuditoria
): Promise<ResultadoAuditoria> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(200, Math.max(10, filtros.porPagina ?? 50));
  const offset = (pagina - 1) * porPagina;

  // Constrói os filtros dinamicamente com sql fragmentado
  const condicoes = [];

  if (filtros.userId) {
    condicoes.push(sql`user_id = ${filtros.userId}`);
  }
  if (filtros.action) {
    condicoes.push(sql`action = ${filtros.action}`);
  }
  if (filtros.entity) {
    condicoes.push(sql`entity = ${filtros.entity}`);
  }
  if (filtros.dataInicio) {
    condicoes.push(sql`created_at >= ${filtros.dataInicio}::date`);
  }
  if (filtros.dataFim) {
    condicoes.push(
      sql`created_at < (${filtros.dataFim}::date + INTERVAL '1 day')`
    );
  }

  // Monta WHERE
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
      user_id AS "userId",
      user_email AS "userEmail",
      user_role AS "userRole",
      action,
      entity,
      entity_id AS "entityId",
      ip_address AS "ipAddress",
      user_agent AS "userAgent",
      before,
      after,
      metadata,
      created_at AS "createdAt"
    FROM audit_log
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${porPagina}
    OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM audit_log
    ${whereClause}
  `);

  const registros = allRows<AuditLogRow>(result);
  const total = Number(firstRow<{ total: number }>(countResult)?.total ?? 0);

  return {
    registros,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/**
 * Retorna os valores distintos de actions e entities presentes no log,
 * para popular os selects de filtro.
 */
export async function getOpcoesFiltro(): Promise<{
  actions: string[];
  entities: string[];
  users: Array<{ id: string; email: string; role: string | null }>;
}> {
  const actionsResult = await db.execute(sql`
    SELECT DISTINCT action FROM audit_log ORDER BY action
  `);
  const entitiesResult = await db.execute(sql`
    SELECT DISTINCT entity FROM audit_log ORDER BY entity
  `);
  const usersResult = await db.execute(sql`
    SELECT DISTINCT ON (user_id)
      user_id AS id,
      user_email AS email,
      user_role AS role
    FROM audit_log
    WHERE user_id IS NOT NULL
    ORDER BY user_id, created_at DESC
  `);

  return {
    actions: allRows<{ action: string }>(actionsResult).map((r) => r.action),
    entities: allRows<{ entity: string }>(entitiesResult).map((r) => r.entity),
    users: allRows<{ id: string; email: string; role: string | null }>(
      usersResult
    ),
  };
}