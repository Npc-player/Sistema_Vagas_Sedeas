// src/app/(app)/auditoria/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import {
  listarAuditoria,
  getOpcoesFiltro,
  type FiltrosAuditoria,
} from '@/lib/audit/queries';
import { FiltrosAuditoria as FiltrosUI } from './filtros';
import { LinhaLog } from './linha-log';
import { Button } from '@/components/ui/button';
import { BotaoExportar } from './botao-exportar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    action?: string;
    entity?: string;
    userId?: string;
    dataInicio?: string;
    dataFim?: string;
    pagina?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.verAuditoria(session.role)) redirect('/dashboard');

  const params = await searchParams;

  const filtros: FiltrosAuditoria = {
    action: params.action,
    entity: params.entity,
    userId: params.userId,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    pagina: params.pagina ? parseInt(params.pagina, 10) : 1,
    porPagina: 50,
  };

  // Sequencial (pool de 1 conexão evita concorrência com Supavisor)
  const resultado = await listarAuditoria(filtros);
  const opcoes = await getOpcoesFiltro();

  // Função para construir URL da paginação preservando filtros
  function urlPagina(pagina: number): string {
    const p = new URLSearchParams();
    if (params.action) p.set('action', params.action);
    if (params.entity) p.set('entity', params.entity);
    if (params.userId) p.set('userId', params.userId);
    if (params.dataInicio) p.set('dataInicio', params.dataInicio);
    if (params.dataFim) p.set('dataFim', params.dataFim);
    p.set('pagina', String(pagina));
    return `/auditoria?${p.toString()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            Governança
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-teal-700" />
            Trilha de Auditoria
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Registro imutável de todas as operações do sistema · LGPD Art. 37
          </p>
        </div>
        <BotaoExportar />
      </div>

      {/* Aviso LGPD */}
      <div className="mb-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
        <p className="text-sm text-teal-900">
          <strong>Registros imutáveis:</strong> os logs de auditoria não podem
          ser editados ou excluídos, nem mesmo pelo Administrador. O acesso a
          esta página também é registrado.
        </p>
      </div>

      {/* Filtros */}
      <FiltrosUI opcoes={opcoes} />

      {/* Tabela */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">
            {resultado.total}{' '}
            {resultado.total === 1 ? 'registro' : 'registros'}{' '}
            <span className="text-slate-400 font-normal">
              · página {resultado.pagina} de {resultado.totalPaginas}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {resultado.registros.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Nenhum registro encontrado com os filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Data/hora
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Ação
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Entidade
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Usuário
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Registro
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.registros.map((log) => (
                      <LinhaLog key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {resultado.totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Mostrando{' '}
                    {(resultado.pagina - 1) * resultado.porPagina + 1}–
                    {Math.min(
                      resultado.pagina * resultado.porPagina,
                      resultado.total
                    )}{' '}
                    de {resultado.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={urlPagina(resultado.pagina - 1)}
                      aria-disabled={resultado.pagina <= 1}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resultado.pagina <= 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                    </Link>

                    <span className="text-xs text-slate-600 px-2">
                      {resultado.pagina} / {resultado.totalPaginas}
                    </span>

                    <Link
                      href={urlPagina(resultado.pagina + 1)}
                      aria-disabled={
                        resultado.pagina >= resultado.totalPaginas
                      }
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          resultado.pagina >= resultado.totalPaginas
                        }
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}