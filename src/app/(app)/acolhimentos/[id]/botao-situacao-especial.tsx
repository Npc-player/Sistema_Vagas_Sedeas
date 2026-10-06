// src/app/(app)/acolhimentos/[id]/botao-situacao-especial.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  situacoesEspeciais,
  LABEL_SITUACAO_ESPECIAL,
} from '@/lib/validations/acolhimento';
import {
  registrarSituacaoEspecialAction,
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
import { AlertTriangle } from 'lucide-react';

interface BotaoSituacaoEspecialProps {
  acolhimentoId: string;
  situacaoAtual: string | null;
  situacaoDetalheAtual: string | null;
  situacaoEmAtual: string | null;
}

export function BotaoSituacaoEspecial({
  acolhimentoId,
  situacaoAtual,
  situacaoDetalheAtual,
  situacaoEmAtual,
}: BotaoSituacaoEspecialProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [situacao, setSituacao] = useState<string>('');
  const [detalhe, setDetalhe] = useState<string>('');
  const [data, setData] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(v: boolean) {
    setAberto(v);
    if (!v) {
      setSituacao('');
      setDetalhe('');
      setData(new Date().toISOString().split('T')[0]);
      setErro(null);
      setFieldErrors({});
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('acolhimentoId', acolhimentoId);
    formData.set('situacaoEspecial', situacao);
    formData.set('situacaoOutrosDetalhe', detalhe);
    formData.set('situacaoEspecialEm', data);

    startTransition(async () => {
      const result: AcolhimentoActionState =
        await registrarSituacaoEspecialAction({}, formData);

      if (result.error) {
        setErro(result.error);
        return;
      }

      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setFieldErrors(result.fieldErrors);
        return;
      }

      // Sucesso
      setAberto(false);
      setSituacao('');
      setDetalhe('');
      setData(new Date().toISOString().split('T')[0]);
      router.refresh();
    });
  }

  const precisaDetalhe = situacao === 'OUTROS';
  const valido =
    situacao !== '' &&
    data !== '' &&
    (situacao !== 'OUTROS' || detalhe.trim().length >= 20);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setAberto(true)}
        className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
      >
        <AlertTriangle className="w-4 h-4 mr-1.5" />
        {situacaoAtual
          ? 'Alterar situação especial'
          : 'Registrar situação especial'}
      </Button>

      <Dialog open={aberto} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl! max-h-[90vh] overflow-y-auto overflow-x-hidden wrap-break">
          <DialogHeader>
            <DialogTitle>Registrar situação especial</DialogTitle>
            <DialogDescription>
              Situações especiais representam condições que fogem do fluxo
              normal de desacolhimento. Use para <strong>evasão</strong>{' '}
              (acolhido que fugiu da unidade) ou <strong>outros casos</strong>{' '}
              (família extensa/substituta aguardando parecer judicial). O
              acolhimento permanece vinculado, mas é contabilizado na coluna{' '}
              <strong>EVASÕES/OUTROS</strong> dos relatórios.
            </DialogDescription>
          </DialogHeader>

          {situacaoAtual && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">
                Situação atual
              </p>
              <p className="text-amber-900 font-medium">
                {LABEL_SITUACAO_ESPECIAL[situacaoAtual] ?? situacaoAtual}
              </p>
              {situacaoDetalheAtual && (
                <p className="text-xs text-amber-800 mt-1 whitespace-pre-wrap">
                  {situacaoDetalheAtual}
                </p>
              )}
              {situacaoEmAtual && (
                <p className="text-xs text-amber-700 mt-1">
                  Registrada em{' '}
                  {new Date(
                    situacaoEmAtual + 'T00:00:00'
                  ).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {Object.keys(fieldErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {Object.entries(fieldErrors).map(([campo, msgs]) => (
                      <li key={campo}>
                        <strong>{campo}</strong>: {msgs.join(', ')}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="situacaoEspecial">Situação *</Label>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger id="situacaoEspecial">
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  {situacoesEspeciais.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LABEL_SITUACAO_ESPECIAL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="situacaoEspecialEm">Data da situação *</Label>
              <Input
                id="situacaoEspecialEm"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="situacaoOutrosDetalhe">
                Detalhamento{' '}
                {precisaDetalhe && <span className="text-red-600"> *</span>}
              </Label>
              <Textarea
                id="situacaoOutrosDetalhe"
                rows={4}
                placeholder={
                  precisaDetalhe
                    ? 'Descreva a situação. Ex.: Acolhido sob guarda de tia materna (família extensa) aguardando decisão judicial do processo 0001234-56.2026.8.26.0100.'
                    : 'Informações complementares (opcional)'
                }
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
                disabled={isPending}
              />
              {precisaDetalhe && (
                <p className="text-xs text-slate-500 mt-1">
                  Mínimo 20 caracteres. Atual: {detalhe.trim().length}
                </p>
              )}
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
              <Button type="submit" disabled={isPending || !valido}>
                {isPending ? 'Salvando...' : 'Salvar situação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}