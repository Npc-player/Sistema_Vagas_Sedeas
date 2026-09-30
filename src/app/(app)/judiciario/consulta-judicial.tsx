// src/app/(app)/judiciario/consulta-judicial.tsx
'use client';

import { useActionState, useState } from 'react';
import {
  consultarJudicialAction,
  type ConsultaJudicialState,
} from './actions';
import {
  tiposBusca,
  LABEL_TIPO_BUSCA,
} from '@/lib/validations/consulta-judicial';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ShieldAlert,
  FileSearch,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';

const initialState: ConsultaJudicialState = {};

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

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

const MIN_JUSTIFICATIVA = 50;

export function ConsultaJudicial() {
  const [state, formAction, isPending] = useActionState(
    consultarJudicialAction,
    initialState
  );

  const [tipo, setTipo] = useState<string>('');
  const [justificativa, setJustificativa] = useState('');

  const justificativaValida =
    justificativa.trim().length >= MIN_JUSTIFICATIVA;

  const placeholderTermo =
    tipo === 'CPF'
      ? '000.000.000-00'
      : tipo === 'PROTOCOLO'
        ? 'ACO-2026-000001'
        : 'Nome completo ou parcial';

  return (
    <>
      {/* Formulário */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="w-5 h-5 text-teal-700" />
            Parâmetros da consulta
          </CardTitle>
          <CardDescription>
            Todos os campos são obrigatórios. A consulta só é executada após
            registro em auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {Object.entries(state.fieldErrors).map(([campo, msgs]) => (
                      <li key={campo}>
                        <strong>{campo}</strong>: {msgs.join(', ')}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo-select">Tipo de busca *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo-select">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposBusca.map((t) => (
                      <SelectItem key={t} value={t}>
                        {LABEL_TIPO_BUSCA[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="tipo" value={tipo} />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="termo">Termo de busca *</Label>
                <Input
                  id="termo"
                  name="termo"
                  placeholder={placeholderTermo}
                  disabled={!tipo}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="processoJudicial">
                Número do processo / ofício (opcional)
              </Label>
              <Input
                id="processoJudicial"
                name="processoJudicial"
                placeholder="Ex.: 0001234-56.2026.8.26.0100 ou Ofício nº 123/2026"
              />
            </div>

            <div>
              <Label htmlFor="justificativa">
                Justificativa legal *
              </Label>
              <Textarea
                id="justificativa"
                name="justificativa"
                rows={4}
                placeholder="Descreva a finalidade legal da consulta (mínimo 50 caracteres). Ex.: Requisição do Ministério Público para instrução de inquérito civil..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate-500">
                  Mínimo {MIN_JUSTIFICATIVA} caracteres · máximo 2000
                </p>
                <p
                  className={`text-xs ${
                    justificativaValida
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {justificativa.trim().length} / 2000
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  isPending || !tipo || !justificativaValida
                }
              >
                <Search className="w-4 h-4 mr-1.5" />
                {isPending ? 'Consultando...' : 'Executar consulta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
      {state.protocoloConsulta && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-sm text-teal-900 flex-1">
            <p className="font-medium">
              Consulta registrada em auditoria
            </p>
            <p className="text-xs mt-0.5">
              Protocolo:{' '}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-teal-200">
                {state.protocoloConsulta}
              </code>
            </p>
            <p className="text-xs mt-1">
              {state.totalResultados}{' '}
              {state.totalResultados === 1
                ? 'resultado encontrado'
                : 'resultados encontrados'}
            </p>
          </div>
        </div>
      )}

      {state.resultados && state.resultados.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Nenhum registro encontrado para os parâmetros informados.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              A consulta foi registrada em auditoria mesmo sem resultados.
            </p>
          </CardContent>
        </Card>
      )}

      {state.resultados && state.resultados.length > 0 && (
        <div className="space-y-4">
          {state.resultados.map((r) => (
            <Card key={r.acolhidoId} className="border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {r.nomeCompleto}
                      </CardTitle>
                      {r.nomeSocial && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Nome social: {r.nomeSocial}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {r.idade} anos
                        </Badge>
                        {r.temDadosSaude && (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-700 border-amber-200 bg-amber-50"
                          >
                            <HeartPulse className="w-3 h-3 mr-1" />
                            Possui dados de saúde registrados
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Dados pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Data de nascimento
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      {new Date(
                        r.dataNascimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      CPF
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5 font-mono">
                      {r.cpf ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      RG
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5 font-mono">
                      {r.rg ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      Filiação
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      Mãe: {r.nomeMae ?? '—'}
                    </p>
                    <p className="text-sm text-slate-900">
                      Pai: {r.nomePai ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Histórico de acolhimentos */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Histórico de acolhimentos ({r.acolhimentos.length})
                  </p>
                  {r.acolhimentos.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Nenhum acolhimento registrado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {r.acolhimentos.map((ac) => (
                        <div
                          key={ac.protocolo}
                          className={`border rounded-md p-3 text-sm ${
                            ac.ativo
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-mono text-xs text-slate-600">
                                {ac.protocolo}
                              </p>
                              <p className="text-slate-900 mt-1">
                                {ac.unidadeNome}{' '}
                                <span className="text-xs text-slate-500">
                                  ({ac.unidadeTipo})
                                </span>
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {LABEL_MOTIVO[ac.motivoAcolhimento] ??
                                  ac.motivoAcolhimento}{' '}
                                · {LABEL_REGIME[ac.regime] ?? ac.regime}
                              </p>
                            </div>
                            <div className="text-right">
                              {ac.ativo ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-xs">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Encerrado
                                </Badge>
                              )}
                              <p className="text-xs text-slate-500 mt-1.5">
                                Entrada:{' '}
                                {new Date(
                                  ac.dataAcolhimento + 'T00:00:00'
                                ).toLocaleDateString('pt-BR')}
                              </p>
                              {ac.dataDesacolhimento && (
                                <p className="text-xs text-slate-500">
                                  Saída:{' '}
                                  {new Date(
                                    ac.dataDesacolhimento + 'T00:00:00'
                                  ).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aviso sobre saúde */}
                {r.temDadosSaude && (
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900">
                      Esta pessoa possui dados de saúde registrados no
                      sistema. Por força do Art. 11 da LGPD, esses dados são
                      classificados como sensíveis e não são exibidos neste
                      módulo. Requisição específica deve ser encaminhada à
                      Secretaria de Desenvolvimento e Assistência Social.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}