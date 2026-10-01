// src/app/(app)/dpo/lista-requisicoes.tsx
'use client';

import { useState } from 'react';
import {
  LABEL_TIPO_REQUISICAO,
  LABEL_STATUS_REQUISICAO,
} from '@/lib/validations/dpo';
import type { RequisicaoLgpd } from '@/lib/dpo/queries';
import { Badge } from '@/components/ui/badge';
import { BotaoResponder } from './botao-responder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COR_STATUS: Record<string, string> = {
  RECEBIDA: 'bg-blue-50 text-blue-800 border-blue-200',
  EM_ANALISE: 'bg-amber-50 text-amber-800 border-amber-200',
  RESPONDIDA: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ARQUIVADA: 'bg-slate-50 text-slate-600 border-slate-200',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ListaRequisicoesProps {
  requisicoes: RequisicaoLgpd[];
}

export function ListaRequisicoes({ requisicoes }: ListaRequisicoesProps) {
  const [detalhe, setDetalhe] = useState<RequisicaoLgpd | null>(null);

  // Limite calculado uma única vez por montagem (evita Date.now() em render)
  const [limiteVencimento] = useState<number>(
    () => Date.now() + 5 * 24 * 60 * 60 * 1000
  );

  if (requisicoes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">
          Nenhuma requisição registrada até o momento.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          As requisições podem ser registradas por qualquer pessoa através do
          canal público (a ser publicado).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Protocolo
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Tipo
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Requerente
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Recebida
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Prazo
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-3 py-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {requisicoes.map((r) => {
              const vencendo =
                r.prazoResposta &&
                (r.status === 'RECEBIDA' || r.status === 'EM_ANALISE') &&
                new Date(r.prazoResposta + 'T00:00:00').getTime() <=
                  limiteVencimento;

              return (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50"
                >
                  <td className="px-3 py-3 text-xs font-mono text-slate-600">
                    {r.protocolo}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-700">
                    {LABEL_TIPO_REQUISICAO[r.tipo] ?? r.tipo}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-slate-900">
                      {r.requerenteNome}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.requerenteEmail}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {formatarData(r.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {r.prazoResposta ? (
                      <span
                        className={
                          vencendo
                            ? 'text-rose-700 font-medium flex items-center gap-1'
                            : 'text-slate-600'
                        }
                      >
                        {vencendo && (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        )}
                        {formatarData(r.prazoResposta)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs border ${
                        COR_STATUS[r.status] ?? ''
                      }`}
                    >
                      {LABEL_STATUS_REQUISICAO[r.status] ?? r.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetalhe(r)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {r.status !== 'ARQUIVADA' && (
                        <BotaoResponder requisicao={r} variant="outline" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da requisição</DialogTitle>
                <DialogDescription>
                  Protocolo{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    {detalhe.protocolo}
                  </code>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Tipo
                    </p>
                    <p className="text-slate-900 mt-0.5">
                      {LABEL_TIPO_REQUISICAO[detalhe.tipo] ?? detalhe.tipo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Status
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs border mt-0.5 ${
                        COR_STATUS[detalhe.status] ?? ''
                      }`}
                    >
                      {LABEL_STATUS_REQUISICAO[detalhe.status] ?? detalhe.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Recebida em
                    </p>
                    <p className="text-slate-900 mt-0.5 text-xs">
                      {formatarDataHora(detalhe.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Prazo de resposta
                    </p>
                    <p className="text-slate-900 mt-0.5 text-xs">
                      {formatarData(detalhe.prazoResposta)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Requerente
                  </p>
                  <p className="text-slate-900">{detalhe.requerenteNome}</p>
                  <p className="text-xs text-slate-600">
                    {detalhe.requerenteEmail}
                  </p>
                  {detalhe.requerenteTelefone && (
                    <p className="text-xs text-slate-600">
                      {detalhe.requerenteTelefone}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Descrição
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap text-sm">
                    {detalhe.descricao}
                  </p>
                </div>

                {detalhe.resposta && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Resposta registrada
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap text-sm">
                      {detalhe.resposta}
                    </p>
                    {detalhe.respondidoEm && (
                      <p className="text-xs text-slate-500 mt-2">
                        Respondido em{' '}
                        {formatarDataHora(detalhe.respondidoEm)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}