// src/app/(app)/unidades/[id]/botao-status.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { alternarStatusUnidadeAction } from '../actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Power, PowerOff } from 'lucide-react';

interface BotaoStatusProps {
  unidadeId: string;
  unidadeNome: string;
  ativo: boolean;
}

export function BotaoStatusUnidade({
  unidadeId,
  unidadeNome,
  ativo,
}: BotaoStatusProps) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await alternarStatusUnidadeAction(unidadeId, !ativo);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant={ativo ? 'outline' : 'default'}
        onClick={() => setAberto(true)}
        className={
          ativo
            ? 'text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800'
            : ''
        }
      >
        {ativo ? (
          <>
            <PowerOff className="w-4 h-4 mr-1.5" />
            Desativar
          </>
        ) : (
          <>
            <Power className="w-4 h-4 mr-1.5" />
            Reativar
          </>
        )}
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ativo ? 'Desativar unidade' : 'Reativar unidade'}
            </DialogTitle>
            <DialogDescription>
              {ativo ? (
                <>
                  Tem certeza que deseja desativar a unidade{' '}
                  <strong>{unidadeNome}</strong>?
                  <br />
                  <br />
                  A unidade deixa de aparecer como opção para novos
                  acolhimentos, mas o histórico é preservado.
                </>
              ) : (
                <>
                  Deseja reativar a unidade <strong>{unidadeNome}</strong>?
                  <br />
                  <br />
                  Ela voltará a ficar disponível para receber novos
                  acolhimentos.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmar}
              disabled={isPending}
              className={
                ativo
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : ''
              }
            >
              {isPending
                ? 'Processando...'
                : ativo
                  ? 'Sim, desativar'
                  : 'Sim, reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}