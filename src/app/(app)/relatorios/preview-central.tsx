// src/app/(app)/relatorios/preview-central.tsx
import type { LinhaCentralRegulacao } from '@/lib/relatorios/queries';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface GrupoUnidade {
  unidadeId: string;
  unidadeNome: string;
  unidadeTipo: string;
  provisorio: LinhaCentralRegulacao | null;
  definitivo: LinhaCentralRegulacao | null;
}

function agruparPorUnidade(linhas: LinhaCentralRegulacao[]): GrupoUnidade[] {
  const map = new Map<string, GrupoUnidade>();
  for (const l of linhas) {
    let g = map.get(l.unidadeId);
    if (!g) {
      g = {
        unidadeId: l.unidadeId,
        unidadeNome: l.unidadeNome,
        unidadeTipo: l.unidadeTipo,
        provisorio: null,
        definitivo: null,
      };
      map.set(l.unidadeId, g);
    }
    if (l.tipoVaga === 'PROVISORIO') g.provisorio = l;
    else g.definitivo = l;
  }
  return Array.from(map.values());
}

interface PreviewCentralProps {
  linhas: LinhaCentralRegulacao[];
}

export function PreviewCentral({ linhas }: PreviewCentralProps) {
  const grupos = agruparPorUnidade(linhas);

  if (grupos.length === 0) {
    return (
      <Card className="border-slate-200 border-dashed">
        <CardContent className="py-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Nenhuma unidade ativa cadastrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Totais
  const totais = linhas.reduce(
    (acc, l) => ({
      meta: acc.meta + (l.meta ?? 0),
      entradas: acc.entradas + l.entradas,
      saidas: acc.saidas + l.saidas,
      evasoesOutros: acc.evasoesOutros + l.evasoesOutros,
      acolhidos: acc.acolhidos + l.acolhidos,
      fixos: acc.fixos + l.fixos,
      vagasDisponiveis: acc.vagasDisponiveis + (l.vagasDisponiveis ?? 0),
    }),
    {
      meta: 0,
      entradas: 0,
      saidas: 0,
      evasoesOutros: 0,
      acolhidos: 0,
      fixos: 0,
      vagasDisponiveis: 0,
    }
  );

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">
          Serviços de Acolhimento Institucional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-white">
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px] leading-tight">
                  UNIDADE
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px] leading-tight">
                  TIPOS
                  <br />
                  DE VAGAS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                  META
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                  ENTRADAS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                  SAÍDAS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px] leading-tight">
                  EVASÕES
                  <br />
                  OUTROS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                  ACOLHIDOS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                  FIXOS
                </th>
                <th className="border border-black px-1 py-2 text-center font-bold text-[10px] leading-tight">
                  VAGAS
                  <br />
                  DISPONÍVEIS
                </th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g, idx) => {
                const bg = idx % 2 === 0 ? 'bg-green-50' : 'bg-white';
                const prov = g.provisorio;
                const def = g.definitivo;
                return (
                  <>
                    {/* Linha PROVISÓRIAS */}
                    <tr key={`${g.unidadeId}-prov`} className={bg}>
                      <td
                        rowSpan={2}
                        className={`border border-black px-2 py-1 text-left align-middle font-medium text-slate-900 ${bg}`}
                      >
                        {g.unidadeNome}
                      </td>
                      <td
                        className={`border border-black px-2 py-1 text-left ${bg}`}
                      >
                        PROVISÓRIAS
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.meta ?? '—'}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.entradas ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.saidas ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.evasoesOutros ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.acolhidos ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.fixos ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {prov?.vagasDisponiveis ?? '—'}
                      </td>
                    </tr>

                    {/* Linha DEFINITIVAS */}
                    <tr key={`${g.unidadeId}-def`} className={bg}>
                      {/* UNIDADE já coberta pelo rowSpan acima */}
                      <td
                        className={`border border-black px-2 py-1 text-left ${bg}`}
                      >
                        DEFINITIVAS
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center text-slate-400 ${bg}`}
                      >
                        —
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {def?.entradas ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {def?.saidas ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {def?.evasoesOutros ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {def?.acolhidos ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center ${bg}`}
                      >
                        {def?.fixos ?? 0}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 text-center text-slate-400 ${bg}`}
                      >
                        —
                      </td>
                    </tr>
                  </>
                );
              })}

              {/* TOTAL */}
              <tr className="bg-white font-semibold">
                <td className="border border-black px-2 py-1 text-left">
                  TOTAL
                </td>
                <td className="border border-black px-2 py-1 text-left">—</td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.meta}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.entradas}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.saidas}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.evasoesOutros}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.acolhidos}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.fixos}
                </td>
                <td className="border border-black px-1 py-1 text-center font-bold">
                  {totais.vagasDisponiveis}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-500 space-y-1">
          <p>
            <strong>META / VAGAS:</strong> referem-se à capacidade total da
            unidade e são exibidas apenas na linha PROVISÓRIAS.
          </p>
          <p>
            <strong>ACOLHIDOS:</strong> pessoas em acolhimento ao fim do
            período, segmentadas por regime.
          </p>
          <p>
            <strong>FIXOS:</strong> acolhidos que já estavam na unidade antes
            do início do período (permanecentes).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}