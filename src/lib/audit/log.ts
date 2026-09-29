// src/lib/audit/log.ts
// Função central de gravação de auditoria.
// Usa Drizzle (bypassa RLS) — só pode ser chamada em código server-side.
//
// POLÍTICA: falhas de auditoria NÃO derrubam a operação principal.
// Se a gravação falhar, o erro é logado em stderr mas a operação segue.
// Motivo: compliance pede "melhor esforço", não "falha total".

import { db } from '@/db/client';
import { auditLog } from '@/db/schema';
import type { AuditContext, AuditEntry } from './types';

/**
 * Grava uma entrada no audit_log.
 *
 * @param context Contexto extraído da requisição (usuário, IP, user-agent)
 * @param entry   Dados da operação auditada
 */
export async function audit(
  context: AuditContext,
  entry: AuditEntry
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      before: entry.before ?? null,
      after: entry.after ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    // Falha de auditoria não deve derrubar a operação principal.
    // Mas precisa ser visível para investigação.
    console.error('[AUDIT] Falha ao gravar log de auditoria:', {
      entry,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}