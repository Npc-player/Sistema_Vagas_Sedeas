// src/lib/audit/types.ts
// Tipos do serviço de audit trail.
// As ações seguem o padrão CRUD-X (Create, Read, Update, Delete, eXport)
// e incluem eventos de autenticação (LOGIN, LOGOUT).

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT';

export type AuditEntity =
  | 'profiles'
  | 'unidades'
  | 'acolhidos'
  | 'acolhimentos'
  | 'vagas'
  | 'audit_log';

export interface AuditContext {
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditEntry {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}