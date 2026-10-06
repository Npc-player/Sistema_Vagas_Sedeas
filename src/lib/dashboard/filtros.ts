// src/lib/dashboard/filtros.ts
// Tipos e helpers para filtrar os indicadores do dashboard.

import { sql, type SQL } from 'drizzle-orm';

export interface FiltrosDashboard {
  tipo?: string;      // ILPI, SAICA, CENTRO_DIA_IDOSO, SAI, RESIDENCIA_INCLUSIVA
  unidadeId?: string; // UUID específico
}

/**
 * Gera o fragmento SQL de filtro sobre a tabela `unidades`.
 * Sempre inclui `unidades.ativo = true`.
 *
 * @param f Filtros do dashboard
 * @param alias Alias da tabela unidades na query (default: 'u')
 */
export function filtroUnidades(
  f: FiltrosDashboard,
  alias: string = 'u'
): SQL {
  const conds: SQL[] = [sql.raw(`${alias}.ativo = true`)];

  if (f.tipo) {
    conds.push(sql`${sql.raw(alias)}.tipo = ${f.tipo}::tipo_acolhimento`);
  }
  if (f.unidadeId) {
    conds.push(sql`${sql.raw(alias)}.id = ${f.unidadeId}`);
  }

  return sql.join(conds, sql` AND `);
}

/**
 * Indica se há algum filtro ativo (útil para UI).
 */
export function temFiltroAtivo(f: FiltrosDashboard): boolean {
  return !!(f.tipo || f.unidadeId);
}