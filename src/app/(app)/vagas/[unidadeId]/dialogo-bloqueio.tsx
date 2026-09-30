// src/app/(app)/vagas/[unidadeId]/dialogo-bloqueio.tsx
'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  bloquearVagaSchema,
  motivosBloqueio,
  LABEL_MOTIVO_BLOQUEIO,
  type BloquearVagaInput,
} from '@/lib/validations/vaga';
import { bloquearVagaAction, type VagaActionState } from '../actions';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const initialState: VagaActionState = {};

interface DialogoBloqueioProps {
  vagaId: string;
  numeroLeito: number;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}

export function DialogoBloqueio({
  vagaId,
  numeroLeito,
  aberto,
  onOpenChange,
}: DialogoBloqueioProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    bloquearVagaAction,
    initialState
  );

  const {
    register,
    formState: { errors },
    setValue,
    control,
    reset,
  } = useForm<BloquearVagaInput>({
    resolver: zodResolver(bloquearVagaSchema),
    defaultValues: {
      vagaId,
      motivo: undefined,
      motivoDetalhe: '',
      prazo: '',
    },
  });

  const motivoAtual = useWatch({ control, name: 'motivo' });

  // Limpa ao fechar
  useEffect(() => {
    if (!aberto) {
      reset({
        vagaId,
        motivo: undefined,
        motivoDetalhe: '',
        prazo: '',
      });
    }
  }, [aberto, reset, vagaId]);

  // Fecha e atualiza ao sucesso
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bloquear leito {numeroLeito}</DialogTitle>
          <DialogDescription>
            O leito fica indisponível para novos acolhimentos até ser
            desbloqueado. A capacidade física total não é alterada.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" {...register('vagaId')} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Select
              value={motivoAtual ?? ''}
              onValueChange={(v) =>
                setValue('motivo', v as BloquearVagaInput['motivo'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="motivo">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosBloqueio.map((m) => (
                  <SelectItem key={m} value={m}>
                    {LABEL_MOTIVO_BLOQUEIO[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('motivo')} />
            {errors.motivo && (
              <p className="text-sm text-red-600 mt-1">
                {errors.motivo.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="motivoDetalhe">
              Detalhes {motivoAtual === 'OUTRO' ? '*' : '(opcional)'}
            </Label>
            <Textarea
              id="motivoDetalhe"
              rows={3}
              placeholder={
                motivoAtual === 'OUTRO'
                  ? 'Descreva o motivo do bloqueio'
                  : 'Informações complementares (opcional)'
              }
              {...register('motivoDetalhe')}
            />
            {errors.motivoDetalhe && (
              <p className="text-sm text-red-600 mt-1">
                {errors.motivoDetalhe.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="prazo">Prazo estimado *</Label>
            <Input
              id="prazo"
              type="date"
              {...register('prazo')}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.prazo && (
              <p className="text-sm text-red-600 mt-1">
                {errors.prazo.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending ? 'Bloqueando...' : 'Confirmar bloqueio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}