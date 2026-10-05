// src/app/(app)/acolhimentos/novo/formulario.tsx
'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  motivosAcolhimento,
  regimesAcolhimento,
  LABEL_MOTIVO_ACOLHIMENTO,
  LABEL_REGIME,
  LABEL_TIPO_ACOLHIMENTO,
  verificarCompatibilidade,
} from '@/lib/validations/acolhimento';
import { calcularIdade } from '@/lib/validations/acolhido';
import {
  admitirAction,
  type AcolhimentoActionState,
} from '../actions';
import type { AcolhidoOption, UnidadeOption } from './page';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  BedDouble,
  CheckCircle2,
  User,
  Calendar,
  Building2,
  FileText,
  Users,
} from 'lucide-react';

const initialState: AcolhimentoActionState = {};

interface FormularioAdmissaoProps {
  acolhidos: AcolhidoOption[];
  unidades: UnidadeOption[];
}

export function FormularioAdmissao({
  acolhidos,
  unidades,
}: FormularioAdmissaoProps) {
  const [state, formAction, isPending] = useActionState(
    admitirAction,
    initialState
  );

  const [acolhidoId, setAcolhidoId] = useState<string>('');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [vagaId, setVagaId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [regime, setRegime] = useState<string>('');
  const [dataAcolhimento, setDataAcolhimento] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [motivoDetalhe, setMotivoDetalhe] = useState<string>('');

  // Dados processuais
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [numeroMedidaProtetiva, setNumeroMedidaProtetiva] =
    useState<string>('');
  const [numeroGuiaAcolhimento, setNumeroGuiaAcolhimento] =
    useState<string>('');
  const [territorio, setTerritorio] = useState<string>('');

  // Equipe técnica do acolhimento
  const [asVaraInfancia, setAsVaraInfancia] = useState<string>('');
  const [psicVaraInfancia, setPsicVaraInfancia] = useState<string>('');
  const [asCreas, setAsCreas] = useState<string>('');

  const acolhidoSelecionado = useMemo(
    () => acolhidos.find((a) => a.id === acolhidoId),
    [acolhidos, acolhidoId]
  );

  const unidadeSelecionada = useMemo(
    () => unidades.find((u) => u.id === unidadeId),
    [unidades, unidadeId]
  );

  const compatibilidade = useMemo(() => {
    if (!acolhidoSelecionado || !unidadeSelecionada) return null;
    const idade = calcularIdade(acolhidoSelecionado.dataNascimento);
    return {
      idade,
      ...verificarCompatibilidade(idade, unidadeSelecionada.tipo),
    };
  }, [acolhidoSelecionado, unidadeSelecionada]);

  function resetUnidade() {
    setUnidadeId('');
    setVagaId('');
  }

  // Ao selecionar unidade, pré-preenche a equipe técnica com os valores padrão
  function handleSelecionarUnidade(id: string) {
    setUnidadeId(id);
    setVagaId('');
    const u = unidades.find((x) => x.id === id);
    if (u) {
      setAsVaraInfancia(u.asVaraInfancia ?? '');
      setPsicVaraInfancia(u.psicVaraInfancia ?? '');
      setAsCreas(u.asCreas ?? '');
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium mb-1">Corrija os campos destacados:</p>
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

      {/* 1. Pessoa acolhida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-teal-700" />
            1. Pessoa acolhida
          </CardTitle>
          <CardDescription>
            Apenas pessoas sem acolhimento ativo aparecem nesta lista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acolhidos.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Nenhuma pessoa disponível para admissão. Todas as pessoas
                cadastradas já possuem acolhimento ativo, ou ainda não há
                cadastros.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="acolhido-select">Selecione a pessoa *</Label>
                <Select
                  value={acolhidoId}
                  onValueChange={(v) => {
                    setAcolhidoId(v);
                    resetUnidade();
                  }}
                >
                  <SelectTrigger id="acolhido-select">
                    <SelectValue placeholder="Escolha uma pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {acolhidos.map((a) => {
                      const idade = calcularIdade(a.dataNascimento);
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nomeCompleto} · {idade} anos
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <input type="hidden" name="acolhidoId" value={acolhidoId} />
              </div>

              {acolhidoSelecionado && (
                <div className="text-sm bg-slate-50 rounded-md p-3 border border-slate-200">
                  <p className="font-medium text-slate-900">
                    {acolhidoSelecionado.nomeCompleto}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(
                      acolhidoSelecionado.dataNascimento + 'T00:00:00'
                    ).toLocaleDateString('pt-BR')}
                    {' · '}
                    {calcularIdade(acolhidoSelecionado.dataNascimento)} anos
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Unidade + vaga */}
      {acolhidoId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-teal-700" />
              2. Unidade e vaga
            </CardTitle>
            <CardDescription>
              Apenas unidades compatíveis com o perfil etário são exibidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="unidade-select">Unidade *</Label>
              <Select
                value={unidadeId}
                onValueChange={handleSelecionarUnidade}
              >
                <SelectTrigger id="unidade-select">
                  <SelectValue placeholder="Escolha uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => {
                    const idade = acolhidoSelecionado
                      ? calcularIdade(acolhidoSelecionado.dataNascimento)
                      : 0;
                    const compat = verificarCompatibilidade(idade, u.tipo);
                    const semVagas = u.vagas.length === 0;
                    const desabilitado = !compat.compativel || semVagas;

                    return (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        disabled={desabilitado}
                      >
                        <span className={desabilitado ? 'opacity-60' : ''}>
                          {u.nome} — {u.cidade}/{u.uf} · {u.vagas.length}{' '}
                          {u.vagas.length === 1 ? 'vaga' : 'vagas'}
                          {!compat.compativel && ' (incompatível)'}
                          {compat.compativel && semVagas && ' (sem vagas)'}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <input type="hidden" name="unidadeId" value={unidadeId} />
            </div>

            {unidadeSelecionada && compatibilidade && !compatibilidade.compativel && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{compatibilidade.motivo}</AlertDescription>
              </Alert>
            )}

            {unidadeSelecionada && compatibilidade?.compativel && (
              <div>
                <Label htmlFor="vaga-select">Vaga *</Label>
                <Select value={vagaId} onValueChange={setVagaId}>
                  <SelectTrigger id="vaga-select">
                    <SelectValue placeholder="Escolha a vaga" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadeSelecionada.vagas.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex items-center gap-2">
                          <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                          Vaga {v.numeroLeito}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="vagaId" value={vagaId} />
                <p className="text-xs text-slate-500 mt-1.5">
                  {unidadeSelecionada.vagas.length}{' '}
                  {unidadeSelecionada.vagas.length === 1
                    ? 'vaga disponível'
                    : 'vagas disponíveis'}{' '}
                  em {unidadeSelecionada.nome} (
                  {LABEL_TIPO_ACOLHIMENTO[unidadeSelecionada.tipo]}).
                </p>
              </div>
            )}

            {compatibilidade?.compativel && unidadeSelecionada && (
              <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Perfil compatível: {compatibilidade.idade} anos em{' '}
                  {unidadeSelecionada.tipo}.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Dados da admissão */}
      {vagaId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-teal-700" />
              3. Dados da admissão
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="dataAcolhimento">Data do acolhimento *</Label>
              <Input
                id="dataAcolhimento"
                name="dataAcolhimento"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={dataAcolhimento}
                onChange={(e) => setDataAcolhimento(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="regime-select">Regime *</Label>
              <Select value={regime} onValueChange={setRegime}>
                <SelectTrigger id="regime-select">
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  {regimesAcolhimento.map((r) => (
                    <SelectItem key={r} value={r}>
                      {LABEL_REGIME[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="regime" value={regime} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="motivo-select">Motivo do acolhimento *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger id="motivo-select">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {motivosAcolhimento.map((m) => (
                    <SelectItem key={m} value={m}>
                      {LABEL_MOTIVO_ACOLHIMENTO[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="motivo" value={motivo} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="motivoDetalhe">
                Detalhamento do motivo
                {motivo === 'OUTRO' && (
                  <span className="text-red-600"> *</span>
                )}
              </Label>
              <Textarea
                id="motivoDetalhe"
                name="motivoDetalhe"
                rows={3}
                placeholder="Contexto, circunstâncias, encaminhamentos anteriores..."
                value={motivoDetalhe}
                onChange={(e) => setMotivoDetalhe(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Dados processuais */}
      {vagaId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-teal-700" />
              4. Dados processuais e territoriais
            </CardTitle>
            <CardDescription>
              Campos opcionais. Serão exibidos nos relatórios mensais de
              acolhimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="numeroProcesso">Número do processo</Label>
              <Input
                id="numeroProcesso"
                name="numeroProcesso"
                placeholder="Ex.: 0001234-56.2026.8.26.0100"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="numeroMedidaProtetiva">
                Número da medida protetiva
              </Label>
              <Input
                id="numeroMedidaProtetiva"
                name="numeroMedidaProtetiva"
                placeholder="Ex.: 123/2026"
                value={numeroMedidaProtetiva}
                onChange={(e) => setNumeroMedidaProtetiva(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="numeroGuiaAcolhimento">
                Número da guia de acolhimento
              </Label>
              <Input
                id="numeroGuiaAcolhimento"
                name="numeroGuiaAcolhimento"
                placeholder="Ex.: GA-2026/045"
                value={numeroGuiaAcolhimento}
                onChange={(e) => setNumeroGuiaAcolhimento(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="territorio">Território / região</Label>
              <Input
                id="territorio"
                name="territorio"
                placeholder="Ex.: Santa Rosa, Centro, Enseada..."
                value={territorio}
                onChange={(e) => setTerritorio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Equipe técnica do acolhimento */}
      {vagaId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-teal-700" />
              5. Equipe técnica do acolhimento
            </CardTitle>
            <CardDescription>
              Pré-preenchido com os profissionais da unidade. Edite se este
              caso específico tiver outra equipe de referência.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="asVaraInfancia">
                Assistente Social Vara da Infância
              </Label>
              <Input
                id="asVaraInfancia"
                name="asVaraInfancia"
                placeholder="Ex.: Patrícia"
                value={asVaraInfancia}
                onChange={(e) => setAsVaraInfancia(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="psicVaraInfancia">
                Psicólogo(a) Vara da Infância
              </Label>
              <Input
                id="psicVaraInfancia"
                name="psicVaraInfancia"
                placeholder="Ex.: Tainá"
                value={psicVaraInfancia}
                onChange={(e) => setPsicVaraInfancia(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="asCreas">Assistente Social CREAS</Label>
              <Input
                id="asCreas"
                name="asCreas"
                placeholder="Ex.: Denise"
                value={asCreas}
                onChange={(e) => setAsCreas(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            isPending ||
            !acolhidoId ||
            !unidadeId ||
            !vagaId ||
            !motivo ||
            !regime ||
            !dataAcolhimento ||
            (compatibilidade ? !compatibilidade.compativel : false)
          }
        >
          {isPending ? 'Registrando...' : 'Registrar admissão'}
        </Button>
      </div>
    </form>
  );
}