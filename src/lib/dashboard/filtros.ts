// src/lib/dashboard/filtros.ts
import { sql, type SQL } from 'drizzle-orm';

export interface FiltrosDashboard {
  tipo?: string;
  unidadeId?: string;
}

/**
 * Gera o fragmento SQL de filtro sobre a tabela `unidades`.
 * Sempre inclui `unidades.ativo = true`.
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

export function temFiltroAtivo(f: FiltrosDashboard): boolean {
  return !!(f.tipo || f.unidadeId);
}