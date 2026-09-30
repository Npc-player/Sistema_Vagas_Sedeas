// src/lib/crypto/acolhido.ts
// Helpers para ler acolhidos descriptografando campos sensíveis.
// ⚠️ SÓ pode ser importado em código server-side (bypassa RLS via Drizzle).
// A chave nunca sai daqui para o cliente sem autorização específica.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

function getSecret(): string {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) throw new Error('FIELD_ENCRYPTION_KEY não configurada');
  return secret;
}

export interface AcolhidoBasico {
  id: string;
  nomeCompleto: string;
  nomeSocial: string | null;
  dataNascimento: string;
  nomeMae: string | null;
  nomePai: string | null;
  familiaHistorico: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcolhidoComSensiveis extends AcolhidoBasico {
  cpf: string | null;
  rg: string | null;
  alergias: string | null;
  comorbidades: string | null;
}

/**
 * Lista acolhidos SEM dados sensíveis (CPF, RG, saúde).
 * Uso: listagens, buscas, referências.
 */
export async function listarAcolhidosBasico(): Promise<AcolhidoBasico[]> {
  const result = await db.execute(sql`
    SELECT
      id,
      nome_completo AS "nomeCompleto",
      nome_social AS "nomeSocial",
      data_nascimento AS "dataNascimento",
      nome_mae AS "nomeMae",
      nome_pai AS "nomePai",
      familia_historico AS "familiaHistorico",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM acolhidos
    ORDER BY nome_completo ASC
  `);
  return result as unknown as AcolhidoBasico[];
}

/**
 * Busca um acolhido por ID.
 * @param incluirSensiveis Se true, descriptografa CPF, RG, saúde.
 *   A decisão de incluir deve ser feita pelo caller com base no role.
 */
export async function buscarAcolhidoPorId(
  id: string,
  incluirSensiveis: boolean
): Promise<AcolhidoComSensiveis | null> {
  const secret = getSecret();

  if (incluirSensiveis) {
    const result = await db.execute(sql`
      SELECT
        id,
        nome_completo AS "nomeCompleto",
        nome_social AS "nomeSocial",
        data_nascimento AS "dataNascimento",
        nome_mae AS "nomeMae",
        nome_pai AS "nomePai",
        familia_historico AS "familiaHistorico",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        private.decrypt_text(cpf_encrypted, ${secret}) AS cpf,
        private.decrypt_text(rg_encrypted, ${secret}) AS rg,
        private.decrypt_text(alergias_encrypted, ${secret}) AS alergias,
        private.decrypt_text(comorbidades_encrypted, ${secret}) AS comorbidades
      FROM acolhidos
      WHERE id = ${id}
      LIMIT 1
    `);
    const row = (result as unknown as AcolhidoComSensiveis[])[0];
    return row ?? null;
  }

  const result = await db.execute(sql`
    SELECT
      id,
      nome_completo AS "nomeCompleto",
      nome_social AS "nomeSocial",
      data_nascimento AS "dataNascimento",
      nome_mae AS "nomeMae",
      nome_pai AS "nomePai",
      familia_historico AS "familiaHistorico",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM acolhidos
    WHERE id = ${id}
    LIMIT 1
  `);
  const row = (result as unknown as AcolhidoBasico[])[0];
  if (!row) return null;
  return {
    ...row,
    cpf: null,
    rg: null,
    alergias: null,
    comorbidades: null,
  };
}

/**
 * Retorna o total de acolhidos cadastrados (para dashboard).
 */
export async function contarAcolhidos(): Promise<number> {
  const result = await db.execute(sql`SELECT COUNT(*)::int AS total FROM acolhidos`);
  return (result[0] as { total: number }).total;
}