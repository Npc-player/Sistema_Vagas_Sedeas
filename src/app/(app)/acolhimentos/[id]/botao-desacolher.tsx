// src/app/(app)/acolhimentos/[id]/botao-desacolher.tsx
'use client';

import { useActionState, useState } from 'react';
import {
  motivosDesacolhimento,
  LABEL_MOTIVO_DESACOLHIMENTO,
} from '@/lib/validations/acolhimento';
import {
  desacolherAction,
  type AcolhimentoActionState,
} from '../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogOut } from 'lucide-react';

const initialState: AcolhimentoActionState = {};

interface BotaoDesacolherProps {
  acolhimentoId: string;
  acolhidoNome: string;
  protocolo: string;
  dataAcolhimento: string;
}

export function BotaoDesacolher({
  acolhimentoId,
  acolhidoNome,
  protocolo,
  dataAcolhimento,
}: BotaoDesacolherProps) {
  const [aberto, setAberto] = useState(false);
  // Key usada para forçar reset do form ao reabrir
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, isPending] = useActionState(
    desacolherAction,
    initialState
  );

  const [motivo, setMotivo] = useState<string>('');
  const [dataSaida, setDataSaida] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  function handleOpenChange(novoAberto: boolean) {
    setAberto(novoAberto);
    if (!novoAberto) {
      // Reseta o formulário na próxima abertura (remonta o form)
      setFormKey((k) => k + 1);
      setMotivo('');
      setDataSaida(new Date().toISOString().split('T')[0]);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setAberto(true)}
        className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
      >
        <LogOut className="w-4 h-4 mr-1.5" />
        Registrar desacolhimento
      </Button>

      <Dialog open={aberto} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar desacolhimento</DialogTitle>
            <DialogDescription>
              Encerra o acolhimento de <strong>{acolhidoNome}</strong>{' '}
              (protocolo <span className="font-mono text-xs">{protocolo}</span>
              ).
              <br />
              <br />
              A vaga vinculada voltará a ficar disponível para novas
              admissões.
            </DialogDescription>
          </DialogHeader>

          <form key={formKey} action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="acolhimentoId"
              value={acolhimentoId}
            />

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

            <div>
              <Label htmlFor="dataDesacolhimento">
                Data do desacolhimento *
              </Label>
              <Input
                id="dataDesacolhimento"
                name="dataDesacolhimento"
                type="date"
                min={dataAcolhimento}
                max={new Date().toISOString().split('T')[0]}
                value={dataSaida}
                onChange={(e) => setDataSaida(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Data de entrada:{' '}
                {new Date(dataAcolhimento + 'T00:00:00').toLocaleDateString(
                  'pt-BR'
                )}
              </p>
            </div>

            <div>
              <Label htmlFor="motivoDesacolhimento">Motivo *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger id="motivoDesacolhimento">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {motivosDesacolhimento.map((m) => (
                    <SelectItem key={m} value={m}>
                      {LABEL_MOTIVO_DESACOLHIMENTO[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="motivoDesacolhimento"
                value={motivo}
              />
            </div>

            <div>
              <Label htmlFor="motivoDesacolhimentoDetalhe">
                Detalhamento (opcional)
              </Label>
              <Textarea
                id="motivoDesacolhimentoDetalhe"
                name="motivoDesacolhimentoDetalhe"
                rows={3}
                placeholder="Ex.: retorno ao convívio familiar, transferência para outra unidade, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !motivo || !dataSaida}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isPending ? 'Registrando...' : 'Confirmar desacolhimento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}