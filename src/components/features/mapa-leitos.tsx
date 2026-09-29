// src/components/features/mapa-leitos.tsx
// Mapa visual dos leitos de uma unidade.
// Cores conforme RN-08 e especificação do documento técnico:
//   DISPONIVEL  → verde
//   OCUPADA     → vermelho
//   BLOQUEADA   → amarelo
//   RESERVADA   → azul

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type StatusVaga =
  | 'DISPONIVEL'
  | 'OCUPADA'
  | 'BLOQUEADA'
  | 'RESERVADA';

export interface VagaResumo {
  id: string;
  numeroLeito: number;
  status: StatusVaga;
  motivoBloqueio?: string | null;
  prazoBloqueio?: string | null;
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

interface MapaLeitosProps {
  vagas: VagaResumo[];
}

export function MapaLeitos({ vagas }: MapaLeitosProps) {
  if (vagas.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        Nenhuma vaga cadastrada nesta unidade.
      </p>
    );
  }

  // Ordena por número do leito
  const ordenadas = [...vagas].sort((a, b) => a.numeroLeito - b.numeroLeito);

  // Contagem para a legenda
  const contagem = ordenadas.reduce<Record<StatusVaga, number>>(
    (acc, v) => {
      acc[v.status] = (acc[v.status] ?? 0) + 1;
      return acc;
    },
    { DISPONIVEL: 0, OCUPADA: 0, BLOQUEADA: 0, RESERVADA: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Legenda */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
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

      {/* Grid de leitos */}
      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {ordenadas.map((v) => {
            const s = ESTILO[v.status];
            const tooltipLinhas = [`Leito ${v.numeroLeito} — ${s.label}`];
            if (v.motivoBloqueio) {
              tooltipLinhas.push(`Motivo: ${v.motivoBloqueio}`);
            }
            if (v.prazoBloqueio) {
              tooltipLinhas.push(`Prazo: ${v.prazoBloqueio}`);
            }

            return (
              <Tooltip key={v.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`aspect-square rounded-md border ${s.bg} ${s.border} ${s.texto}
                                flex items-center justify-center text-xs font-semibold
                                cursor-help transition-all hover:scale-105 hover:shadow-sm`}
                  >
                    {v.numeroLeito}
                  </div>
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
    </div>
  );
}