// src/lib/dashboard/rn07.ts
// RN-07: alerta de maioridade para acolhidos em SAICA.
// Detecta acolhidos ativos em unidades do tipo SAICA com idade >= 17 anos e 6 meses.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export interface AlertaMaioridade {
  acolhimentoId: string;
  protocolo: string;
  acolhidoId: string;
  acolhidoNome: string;
  dataNascimento: string;
  idadeAnos: number;
  mesesAte18: number;
  unidadeId: string;
  unidadeNome: string;
  dataAcolhimento: string;
}

function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

export async function getAlertasMaioridadeSaica(): Promise<AlertaMaioridade[]> {
  const result = await db.execute(sql`
    SELECT
      ac.id AS "acolhimentoId",
      ac.protocolo,
      a.id AS "acolhidoId",
      a.nome_completo AS "acolhidoNome",
      a.data_nascimento AS "dataNascimento",
      u.id AS "unidadeId",
      u.nome AS "unidadeNome",
      ac.data_acolhimento AS "dataAcolhimento",
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento))::int AS "idadeAnos",
      (
        EXTRACT(YEAR FROM AGE(a.data_nascimento + INTERVAL '18 years', CURRENT_DATE)) * 12
        + EXTRACT(MONTH FROM AGE(a.data_nascimento + INTERVAL '18 years', CURRENT_DATE))
      )::int AS "mesesAte18"
    FROM acolhimentos ac
    INNER JOIN acolhidos a ON a.id = ac.acolhido_id
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE ac.ativo = true
      AND EXISTS (
        SELECT 1 FROM unidade_publico_alvo upa
        WHERE upa.unidade_id = u.id
          AND upa.publico = 'CRIANCAS_ADOLESCENTES'::publico_alvo
      )
      AND a.data_nascimento <= (CURRENT_DATE - INTERVAL '17 years 6 months')
    ORDER BY a.data_nascimento ASC
  `);

  return allRows<AlertaMaioridade>(result);
}