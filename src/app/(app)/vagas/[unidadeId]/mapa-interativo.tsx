// src/app/(app)/vagas/[unidadeId]/mapa-interativo.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { DialogoBloqueio } from './dialogo-bloqueio';
import { desbloquearVagaAction } from '../actions';
import { Unlock } from 'lucide-react';

export type StatusVaga =
  | 'DISPONIVEL'
  | 'OCUPADA'
  | 'BLOQUEADA'
  | 'RESERVADA';

export interface VagaInterativa {
  id: string;
  numeroLeito: number;
  status: StatusVaga;
  motivoBloqueio: string | null;
  prazoBloqueio: string | null;
}

const ESTILO: Record<
  StatusVaga,
  { bg: string; border: string; texto: string; label: string }
> = {
  DISPONIVEL: {
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    texto: 'text-emerald-900',
    label: 'Disponível',
  },
  OCUPADA: {
    bg: 'bg-rose-100',
    border: 'border-rose-300',
    texto: 'text-rose-900',
    label: 'Ocupada',
  },
  BLOQUEADA: {
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    texto: 'text-amber-900',
    label: 'Bloqueada',
  },
  RESERVADA: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    texto: 'text-blue-900',
    label: 'Reservada',
  },
};

interface MapaInterativoProps {
  vagas: VagaInterativa[];
  podeEditar: boolean;
}

export function MapaInterativo({ vagas, podeEditar }: MapaInterativoProps) {
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaInterativa | null>(
    null
  );
  const [dialogoBloqueioAberto, setDialogoBloqueioAberto] = useState(false);
  const [dialogoDesbloqueioAberto, setDialogoDesbloqueioAberto] =
    useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const ordenadas = [...vagas].sort((a, b) => a.numeroLeito - b.numeroLeito);

  const contagem = ordenadas.reduce<Record<StatusVaga, number>>(
    (acc, v) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    },
    { DISPONIVEL: 0, OCUPADA: 0, BLOQUEADA: 0, RESERVADA: 0 }
  );

  function abrirAcao(v: VagaInterativa) {
    setErro(null);
    setVagaSelecionada(v);
    if (v.status === 'DISPONIVEL') {
      setDialogoBloqueioAberto(true);
    } else if (v.status === 'BLOQUEADA') {
      setDialogoDesbloqueioAberto(true);
    }
  }

  function confirmarDesbloqueio() {
    if (!vagaSelecionada) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await desbloquearVagaAction(vagaSelecionada.id);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setDialogoDesbloqueioAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      {/* Legenda */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs mb-6">
        {(Object.keys(ESTILO) as StatusVaga[]).map((status) => {
          const s = ESTILO[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={`w-3 h-3 rounded-sm border ${s.bg} ${s.border}`}
              />
              <span className="text-slate-600">
                {s.label}{' '}
                <span className="font-semibold text-slate-900">
                  ({contagem[status]})
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {ordenadas.map((v) => {
            const s = ESTILO[v.status];
            const clicavel =
              podeEditar &&
              (v.status === 'DISPONIVEL' || v.status === 'BLOQUEADA');

            const tooltipLinhas = [`Vaga ${v.numeroLeito} — ${s.label}`];
            if (v.motivoBloqueio) {
              tooltipLinhas.push(v.motivoBloqueio);
            }
            if (v.prazoBloqueio) {
              tooltipLinhas.push(`Prazo: ${v.prazoBloqueio}`);
            }
            if (clicavel) {
              tooltipLinhas.push(
                v.status === 'DISPONIVEL'
                  ? 'Clique para bloquear'
                  : 'Clique para desbloquear'
              );
            }

            return (
              <Tooltip key={v.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={!clicavel}
                    onClick={() => clicavel && abrirAcao(v)}
                    className={`aspect-square rounded-md border ${s.bg} ${s.border} ${s.texto}
                                flex items-center justify-center text-xs font-semibold
                                transition-all ${
                                  clicavel
                                    ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-teal-400/40'
                                    : 'cursor-default'
                                }`}
                  >
                    {v.numeroLeito}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {tooltipLinhas.map((linha, i) => (
                    <p key={i} className="text-xs">
                      {linha}
                    </p>
                  ))}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {!podeEditar && (
        <p className="text-xs text-slate-500 mt-4 italic">
          Você está visualizando em modo somente leitura.
        </p>
      )}

      {/* Diálogo de bloqueio */}
      {vagaSelecionada && (
        <DialogoBloqueio
          vagaId={vagaSelecionada.id}
          numeroLeito={vagaSelecionada.numeroLeito}
          aberto={dialogoBloqueioAberto}
          onOpenChange={(aberto) => {
            setDialogoBloqueioAberto(aberto);
            if (!aberto) setVagaSelecionada(null);
          }}
        />
      )}

      {/* Diálogo de desbloqueio */}
      <Dialog
        open={dialogoDesbloqueioAberto}
        onOpenChange={(aberto) => {
          setDialogoDesbloqueioAberto(aberto);
          if (!aberto) {
            setVagaSelecionada(null);
            setErro(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-teal-700" />
              Desbloquear vaga {vagaSelecionada?.numeroLeito}
            </DialogTitle>
            <DialogDescription>
              A vaga voltará ao status <strong>Disponível</strong> e poderá
              receber novos acolhimentos.
            </DialogDescription>
          </DialogHeader>

          {vagaSelecionada?.motivoBloqueio && (
            <div className="text-sm bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Motivo do bloqueio atual
              </p>
              <p className="text-slate-700">{vagaSelecionada.motivoBloqueio}</p>
              {vagaSelecionada.prazoBloqueio && (
                <p className="text-xs text-slate-500 mt-1">
                  Prazo estimado: {vagaSelecionada.prazoBloqueio}
                </p>
              )}
            </div>
          )}

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoDesbloqueioAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarDesbloqueio} disabled={isPending}>
              <Unlock className="w-4 h-4 mr-1.5" />
              {isPending ? 'Desbloqueando...' : 'Confirmar desbloqueio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}