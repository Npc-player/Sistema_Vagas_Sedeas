// src/app/(app)/relatorios/preview-fluxo.tsx
import type { LinhaFluxoDetalhado } from '@/lib/relatorios/queries';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';

const LABEL_MOTIVO: Record<string, string> = {
  VULNERABILIDADE_SOCIAL: 'Vulnerabilidade social',
  NEGLIGENCIA_FAMILIAR: 'Negligência familiar',
  VIOLENCIA_DOMESTICA: 'Violência doméstica',
  ABANDONO: 'Abandono',
  DEPENDENCIA_QUIMICA: 'Dependência química',
  SAUDE_MENTAL: 'Saúde mental',
  SITUACAO_RUA: 'Situação de rua',
  DETERMINACAO_JUDICIAL: 'Determinação judicial',
  OUTRO: 'Outro',
};

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

const LABEL_MOTIVO_DESACOLHIMENTO: Record<string, string> = {
  REINTEGRACAO_FAMILIAR: 'Reintegração familiar',
  TRANSFERENCIA: 'Transferência',
  MAIORIDADE: 'Maioridade',
  OBITO: 'Óbito',
  DECISAO_JUDICIAL: 'Decisão judicial',
  EVASAO: 'Evasão',
};

interface PreviewFluxoProps {
  linhas: LinhaFluxoDetalhado[];
}

interface Grupo {
  chave: string;
  label: string;
  linhas: LinhaFluxoDetalhado[];
}

function agrupar(linhas: LinhaFluxoDetalhado[]): Grupo[] {
  const mapa = new Map<string, LinhaFluxoDetalhado[]>();

  for (const l of linhas) {
    const chave = l.grupoFamiliar ?? `__sem_grupo__${l.acolhimentoId}`;
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave)!.push(l);
  }

  const grupos: Grupo[] = [];
  for (const [chave, valores] of mapa.entries()) {
    if (chave.startsWith('__sem_grupo__')) {
      // Cada acolhido sem grupo fica isolado
      for (const l of valores) {
        grupos.push({
          chave: l.acolhimentoId,
          label: '—',
          linhas: [l],
        });
      }
    } else {
      grupos.push({
        chave,
        label: chave,
        linhas: valores,
      });
    }
  }
  return grupos;
}

export function PreviewFluxo({ linhas }: PreviewFluxoProps) {
  if (linhas.length === 0) {
    return (
      <Card className="border-slate-200 border-dashed">
        <CardContent className="py-12 text-center">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Nenhum acolhimento encontrado para o período.
          </p>
        </CardContent>
      </Card>
    );
  }

  const grupos = agrupar(linhas);

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">
          Fluxo Mensal Detalhado — {linhas.length}{' '}
          {linhas.length === 1 ? 'registro' : 'registros'} ·{' '}
          {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-700">
                <th className="text-left px-2 py-2 font-medium w-16">Grupo</th>
                <th className="text-left px-2 py-2 font-medium">Nome / Filiação</th>
                <th className="text-left px-2 py-2 font-medium w-28">
                  Nascimento
                </th>
                <th className="text-left px-2 py-2 font-medium w-24">
                  Acolhimento
                </th>
                <th className="text-left px-2 py-2 font-medium w-32">
                  Documento
                </th>
                <th className="text-left px-2 py-2 font-medium w-40">
                  Processo / Guia
                </th>
                <th className="text-left px-2 py-2 font-medium w-32">
                  Território
                </th>
                <th className="text-left px-2 py-2 font-medium">
                  Equipe Técnica
                </th>
                <th className="text-left px-2 py-2 font-medium w-40">
                  Motivo
                </th>
                <th className="text-left px-2 py-2 font-medium w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) =>
                g.linhas.map((l, idx) => (
                  <tr
                    key={l.acolhimentoId}
                    className="border-b border-slate-100 align-top"
                  >
                    {idx === 0 ? (
                      <td
                        rowSpan={g.linhas.length}
                        className="px-2 py-2 align-top"
                      >
                        {g.label !== '—' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {g.label}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {g.linhas.length > 1 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                            <Users className="w-3 h-3" />
                            {g.linhas.length} irmãos
                          </div>
                        )}
                      </td>
                    ) : null}

                    <td className="px-2 py-2">
                      <div className="font-medium text-slate-900">
                        {l.nomeCompleto}
                      </div>
                      {l.nomeSocial && (
                        <div className="text-[10px] text-slate-500">
                          Nome social: {l.nomeSocial}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        Mãe: {l.nomeMae ?? '—'}
                      </div>
                      {l.nomePai && (
                        <div className="text-[10px] text-slate-500">
                          Pai: {l.nomePai}
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-2">
                      <div>
                        {new Date(
                          l.dataNascimento + 'T00:00:00'
                        ).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {l.idade} anos
                      </div>
                    </td>

                    <td className="px-2 py-2">
                      {new Date(
                        l.dataAcolhimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="px-2 py-2 font-mono text-[10px]">
                      {l.cpf && <div>CPF: {l.cpf}</div>}
                      {l.rg && <div>RG: {l.rg}</div>}
                      {!l.cpf && !l.rg && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-[10px]">
                      {l.numeroProcesso && (
                        <div>
                          <span className="text-slate-500">Proc.:</span>{' '}
                          {l.numeroProcesso}
                        </div>
                      )}
                      {l.numeroMedidaProtetiva && (
                        <div>
                          <span className="text-slate-500">MP:</span>{' '}
                          {l.numeroMedidaProtetiva}
                        </div>
                      )}
                      {l.numeroGuiaAcolhimento && (
                        <div>
                          <span className="text-slate-500">Guia:</span>{' '}
                          {l.numeroGuiaAcolhimento}
                        </div>
                      )}
                      {!l.numeroProcesso &&
                        !l.numeroMedidaProtetiva &&
                        !l.numeroGuiaAcolhimento && (
                          <span className="text-slate-400">—</span>
                        )}
                    </td>

                    <td className="px-2 py-2 text-[10px]">
                      {l.territorio ?? '—'}
                    </td>

                    <td className="px-2 py-2 text-[10px]">
                      {l.asVaraInfancia && (
                        <div>A.S. Vara: {l.asVaraInfancia}</div>
                      )}
                      {l.psicVaraInfancia && (
                        <div>Psic.: {l.psicVaraInfancia}</div>
                      )}
                      {l.asCreas && <div>A.S. CREAS: {l.asCreas}</div>}
                      {!l.asVaraInfancia &&
                        !l.psicVaraInfancia &&
                        !l.asCreas && (
                          <span className="text-slate-400">—</span>
                        )}
                    </td>

                    <td className="px-2 py-2 text-[10px]">
                      <div>
                        {LABEL_MOTIVO[l.motivo] ?? l.motivo}
                      </div>
                      <div className="text-slate-500">
                        {LABEL_REGIME[l.regime] ?? l.regime}
                      </div>
                    </td>

                    <td className="px-2 py-2">
                      {l.ativo ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]">
                          Ativo
                        </Badge>
                      ) : (
                        <div>
                          <Badge variant="secondary" className="text-[10px]">
                            Encerrado
                          </Badge>
                          {l.dataDesacolhimento && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              {new Date(
                                l.dataDesacolhimento + 'T00:00:00'
                              ).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {l.motivoDesacolhimento && (
                            <div className="text-[10px] text-slate-500">
                              {LABEL_MOTIVO_DESACOLHIMENTO[
                                l.motivoDesacolhimento
                              ] ?? l.motivoDesacolhimento}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}