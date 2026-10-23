// src/app/(app)/relatorios/page.tsx
import { redirect } from 'next/navigation';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
import {
  getCentralRegulacao,
  getFluxoDetalhado,
  calcularPeriodo,
  type TipoPeriodo,
} from '@/lib/relatorios/queries';
import { FiltrosRelatorio, type UnidadeOption } from './filtros';
import { PreviewCentral } from './preview-central';
import { PreviewFluxo } from './preview-fluxo';
import { FileBarChart2 } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    tipoRelatorio?: string;
    tipoPeriodo?: string;
    dataBase?: string;
    dataInicio?: string;
    dataFim?: string;
    unidadeId?: string;
  }>;
}

function formatarDataBR(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function allRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown[] }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  const params = await searchParams;

  const unidadesRaw = await db.execute(sql`
    SELECT id, nome, tipo::text AS tipo
    FROM unidades
    WHERE ativo = true
    ORDER BY nome
  `);
  const unidades = allRows<UnidadeOption>(unidadesRaw);

  const temParametros =
    params.tipoRelatorio && params.tipoPeriodo && params.dataBase;

  // Aceita 'CENTRAL' ou o legado 'CENTRAL_INSTITUCIONAL' — ambos usam a mesma tabela
  const tipoRelatorio =
    params.tipoRelatorio === 'FLUXO_DETALHADO' ? 'FLUXO_DETALHADO' : 'CENTRAL';

  const tipoPeriodo = (params.tipoPeriodo ?? 'MENSAL') as TipoPeriodo;
  const dataBase = params.dataBase ?? new Date().toISOString().split('T')[0];

  const periodo = calcularPeriodo(
    tipoPeriodo,
    dataBase,
    params.dataInicio,
    params.dataFim
  );

  const labelPeriodo = `${formatarDataBR(periodo.inicio)} a ${formatarDataBR(periodo.fim)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Relatórios
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <FileBarChart2 className="w-7 h-7 text-teal-700" />
          Relatórios de Acolhimento
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Geração de relatórios mensais consolidados por unidade e fluxo
          detalhado nominal.
        </p>
      </div>

      <FiltrosRelatorio unidades={unidades} />

      {temParametros ? (
        <>
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-slate-500">Período:</span>{' '}
              <strong className="text-slate-900">{labelPeriodo}</strong>
            </div>
            <div>
              <span className="text-slate-500">Tipo:</span>{' '}
              <strong className="text-slate-900">
                {tipoPeriodo === 'PERSONALIZADO'
                  ? 'Personalizado'
                  : tipoPeriodo.charAt(0) +
                    tipoPeriodo.slice(1).toLowerCase()}
              </strong>
            </div>
          </div>

          {tipoRelatorio === 'CENTRAL' && (
            <Central periodo={periodo} />
          )}

          {tipoRelatorio === 'FLUXO_DETALHADO' && (
            <FluxoDetalhado periodo={periodo} unidadeId={params.unidadeId} />
          )}
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <FileBarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Configure os parâmetros acima e clique em{' '}
            <strong>Gerar relatório</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

async function Central({
  periodo,
}: {
  periodo: { inicio: string; fim: string };
}) {
  const linhas = await getCentralRegulacao(periodo);
  return <PreviewCentral linhas={linhas} />;
}

async function FluxoDetalhado({
  periodo,
  unidadeId,
}: {
  periodo: { inicio: string; fim: string };
  unidadeId?: string;
}) {
  const linhas = await getFluxoDetalhado(periodo, unidadeId);
  return <PreviewFluxo linhas={linhas} />;
}