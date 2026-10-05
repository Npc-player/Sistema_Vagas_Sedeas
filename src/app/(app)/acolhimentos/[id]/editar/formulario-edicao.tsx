// src/app/(app)/acolhimentos/[id]/editar/formulario-edicao.tsx
'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  motivosAcolhimento,
  regimesAcolhimento,
  LABEL_MOTIVO_ACOLHIMENTO,
  LABEL_REGIME,
  type EditarAcolhimentoInput,
} from '@/lib/validations/acolhimento';
import {
  editarAcolhimentoAction,
  type AcolhimentoActionState,
} from '../../actions';

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
import { AlertTriangle, Calendar, FileText, Users } from 'lucide-react';

const initialState: AcolhimentoActionState = {};

interface FormularioEdicaoProps {
  defaultValues: EditarAcolhimentoInput;
}

export function FormularioEdicaoAcolhimento({
  defaultValues,
}: FormularioEdicaoProps) {
  const [state, formAction, isPending] = useActionState(
    editarAcolhimentoAction,
    initialState
  );

  const [motivo, setMotivo] = useState<string>(defaultValues.motivo);
  const [regime, setRegime] = useState<string>(defaultValues.regime);

  const conversaoProvisorioParaDefinitivo =
    defaultValues.regime === 'PROVISORIO' && regime === 'DEFINITIVO';

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={defaultValues.id} />

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

      {conversaoProvisorioParaDefinitivo && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <AlertDescription className="text-amber-900 text-sm">
            <strong>Atenção (RN-06):</strong> a conversão de regime de
            Provisório para Definitivo requer <strong>justificativa técnica</strong>{' '}
            no campo &quot;Detalhamento do motivo&quot;.
          </AlertDescription>
        </Alert>
      )}

      {/* Dados da admissão */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-teal-700" />
            Dados da admissão
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
              defaultValue={defaultValues.dataAcolhimento}
            />
          </div>

          <div>
            <Label htmlFor="regime">Regime *</Label>
            <Select value={regime} onValueChange={setRegime}>
              <SelectTrigger id="regime">
                <SelectValue />
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
            <Label htmlFor="motivo">Motivo do acolhimento *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo">
                <SelectValue />
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
              {(motivo === 'OUTRO' || conversaoProvisorioParaDefinitivo) && (
                <span className="text-red-600"> *</span>
              )}
            </Label>
            <Textarea
              id="motivoDetalhe"
              name="motivoDetalhe"
              rows={3}
              defaultValue={defaultValues.motivoDetalhe ?? ''}
              placeholder="Contexto, circunstâncias, encaminhamentos anteriores..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados processuais */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-teal-700" />
            Dados processuais e territoriais
          </CardTitle>
          <CardDescription>Campos opcionais.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="numeroProcesso">Número do processo</Label>
            <Input
              id="numeroProcesso"
              name="numeroProcesso"
              defaultValue={defaultValues.numeroProcesso ?? ''}
              placeholder="Ex.: 0001234-56.2026.8.26.0100"
            />
          </div>

          <div>
            <Label htmlFor="numeroMedidaProtetiva">
              Número da medida protetiva
            </Label>
            <Input
              id="numeroMedidaProtetiva"
              name="numeroMedidaProtetiva"
              defaultValue={defaultValues.numeroMedidaProtetiva ?? ''}
              placeholder="Ex.: 123/2026"
            />
          </div>

          <div>
            <Label htmlFor="numeroGuiaAcolhimento">
              Número da guia de acolhimento
            </Label>
            <Input
              id="numeroGuiaAcolhimento"
              name="numeroGuiaAcolhimento"
              defaultValue={defaultValues.numeroGuiaAcolhimento ?? ''}
              placeholder="Ex.: GA-2026/045"
            />
          </div>

          <div>
            <Label htmlFor="territorio">Território / região</Label>
            <Input
              id="territorio"
              name="territorio"
              defaultValue={defaultValues.territorio ?? ''}
              placeholder="Ex.: Santa Rosa, Centro, Enseada..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipe técnica */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-teal-700" />
            Equipe técnica de referência
          </CardTitle>
          <CardDescription>
            Pré-preenchido com os profissionais da unidade. Edite se este caso
            específico tiver outra equipe.
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
              defaultValue={defaultValues.asVaraInfancia ?? ''}
              placeholder="Ex.: Patrícia"
            />
          </div>

          <div>
            <Label htmlFor="psicVaraInfancia">
              Psicólogo(a) Vara da Infância
            </Label>
            <Input
              id="psicVaraInfancia"
              name="psicVaraInfancia"
              defaultValue={defaultValues.psicVaraInfancia ?? ''}
              placeholder="Ex.: Tainá"
            />
          </div>

          <div>
            <Label htmlFor="asCreas">Assistente Social CREAS</Label>
            <Input
              id="asCreas"
              name="asCreas"
              defaultValue={defaultValues.asCreas ?? ''}
              placeholder="Ex.: Denise"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={`/acolhimentos/${defaultValues.id}`}>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}