// src/app/(app)/auditoria/linha-log.tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import type { AuditLogRow } from '@/lib/audit/queries';

const COR_ACTION: Record<string, string> = {
  LOGIN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOGIN_FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  LOGOUT: 'bg-slate-50 text-slate-700 border-slate-200',
  CREATE: 'bg-teal-50 text-teal-700 border-teal-200',
  READ: 'bg-blue-50 text-blue-700 border-blue-200',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  EXPORT: 'bg-purple-50 text-purple-700 border-purple-200',
};

const LABEL_ACTION: Record<string, string> = {
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login falho',
  LOGOUT: 'Logout',
  CREATE: 'Criação',
  READ: 'Leitura',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  EXPORT: 'Exportação',
};

const LABEL_ENTITY: Record<string, string> = {
  profiles: 'Perfis',
  unidades: 'Unidades',
  acolhidos: 'Acolhidos',
  acolhimentos: 'Acolhimentos',
  vagas: 'Vagas',
  audit_log: 'Auditoria',
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatarJson(valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  try {
    return JSON.stringify(valor, null, 2);
  } catch {
    return String(valor);
  }
}

interface LinhaLogProps {
  log: AuditLogRow;
}

export function LinhaLog({ log }: LinhaLogProps) {
  const [aberto, setAberto] = useState(false);
  const corAction =
    COR_ACTION[log.action] ?? 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/50">
        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
          {formatarDataHora(log.createdAt)}
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className={`text-xs border ${corAction}`}
          >
            {LABEL_ACTION[log.action] ?? log.action}
          </Badge>
        </td>
        <td className="px-4 py-3 text-xs text-slate-700">
          {LABEL_ENTITY[log.entity] ?? log.entity}
        </td>
        <td className="px-4 py-3 text-xs text-slate-600">
          {log.userEmail ?? '—'}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
          {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAberto(true)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Detalhes
          </Button>
        </td>
      </tr>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da operação</DialogTitle>
            <DialogDescription>
              Registro imutável — não pode ser editado ou excluído
              (LGPD Art. 37).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Data/hora
                </p>
                <p className="text-slate-900 mt-0.5 font-mono text-xs">
                  {formatarDataHora(log.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Ação
                </p>
                <p className="text-slate-900 mt-0.5">
                  {LABEL_ACTION[log.action] ?? log.action}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Entidade
                </p>
                <p className="text-slate-900 mt-0.5">
                  {LABEL_ENTITY[log.entity] ?? log.entity}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  ID do registro
                </p>
                <p className="text-slate-900 mt-0.5 font-mono text-xs break-all">
                  {log.entityId ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Usuário
                </p>
                <p className="text-slate-900 mt-0.5">
                  {log.userEmail ?? '—'}
                </p>
                {log.userRole && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {log.userRole}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  IP de origem
                </p>
                <p className="text-slate-900 mt-0.5 font-mono text-xs">
                  {log.ipAddress ?? '—'}
                </p>
              </div>
            </div>

            {log.userAgent && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  User-Agent
                </p>
                <p className="text-slate-700 mt-0.5 text-xs break-all">
                  {log.userAgent}
                </p>
              </div>
            )}

            {log.before !== null && log.before !== undefined && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Estado anterior
                </p>
                <pre className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs overflow-x-auto">
                  {formatarJson(log.before)}
                </pre>
              </div>
            )}

            {log.after !== null && log.after !== undefined && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Estado posterior
                </p>
                <pre className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs overflow-x-auto">
                  {formatarJson(log.after)}
                </pre>
              </div>
            )}

            {log.metadata !== null && log.metadata !== undefined && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Metadados
                </p>
                <pre className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs overflow-x-auto">
                  {formatarJson(log.metadata)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}