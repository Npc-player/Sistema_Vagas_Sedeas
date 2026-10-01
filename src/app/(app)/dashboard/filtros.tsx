// src/app/(app)/dashboard/filtros.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

export interface UnidadeOption {
  id: string;
  nome: string;
  tipo: string;
}

interface FiltrosDashboardProps {
  unidades: UnidadeOption[];
}

// Labels curtos — exibidos no trigger
const LABEL_TIPO_CURTO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'R.I.',
};

// Labels completos — exibidos no dropdown
const LABEL_TIPO_COMPLETO: Record<string, string> = {
  ILPI: 'ILPI — Instituição de Longa Permanência para Idosos',
  SAICA: 'SAICA — Acolhimento para Crianças e Adolescentes',
  CENTRO_DIA_IDOSO: 'Centro Dia do Idoso',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'Residência Inclusiva (R.I.)',
};

const TIPOS = Object.keys(LABEL_TIPO_COMPLETO);

export function FiltrosDashboard({ unidades }: FiltrosDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [tipo, setTipo] = useState(searchParams.get('tipo') ?? '');
  const [unidadeId, setUnidadeId] = useState(
    searchParams.get('unidadeId') ?? ''
  );

  const unidadesFiltradas = tipo
    ? unidades.filter((u) => u.tipo === tipo)
    : unidades;

  const unidadeIdValida = unidadesFiltradas.some((u) => u.id === unidadeId)
    ? unidadeId
    : '';

  function aplicar() {
    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (unidadeIdValida) params.set('unidadeId', unidadeIdValida);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function limpar() {
    setTipo('');
    setUnidadeId('');
    startTransition(() => {
      router.push(pathname);
    });
  }

  const temFiltro = !!(tipo || unidadeIdValida);

  const descricaoFiltro = (() => {
    const partes: string[] = [];
    if (tipo) partes.push(`Filtrando por ${LABEL_TIPO_COMPLETO[tipo] ?? tipo}`);
    if (unidadeIdValida) {
      const nome = unidades.find((u) => u.id === unidadeIdValida)?.nome ?? '—';
      partes.push(`Unidade: ${nome}`);
    }
    return partes.join(' · ');
  })();

  return (
    <Card className="border-slate-200 mb-6">
      <CardContent className="py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 uppercase tracking-wide shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Filtrar:
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-40">
              <Label
                htmlFor="filtro-tipo"
                className="text-xs text-slate-500 mb-1 block"
              >
                Tipo
              </Label>
              <Select
                value={tipo || '__all__'}
                onValueChange={(v) => {
                  const novoTipo = v === '__all__' ? '' : v;
                  setTipo(novoTipo);
                  if (
                    unidadeId &&
                    !unidades.some(
                      (u) =>
                        u.id === unidadeId &&
                        (!novoTipo || u.tipo === novoTipo)
                    )
                  ) {
                    setUnidadeId('');
                  }
                }}
              >
                <SelectTrigger
                  id="filtro-tipo"
                  className="h-9 w-full text-sm"
                >
                  <span className="truncate">
                    {tipo
                      ? (LABEL_TIPO_CURTO[tipo] ?? tipo)
                      : 'Todos'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os tipos</SelectItem>
                  {TIPOS.map((t, idx) => (
                    <SelectItem key={`tipo-${t}-${idx}`} value={t}>
                      {LABEL_TIPO_COMPLETO[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <Label
                htmlFor="filtro-unidade"
                className="text-xs text-slate-500 mb-1 block"
              >
                Unidade
              </Label>
              <Select
                value={unidadeIdValida || '__all__'}
                onValueChange={(v) => setUnidadeId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger
                  id="filtro-unidade"
                  className="h-9 w-full text-sm [&>span]:truncate"
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as unidades</SelectItem>
                  {unidadesFiltradas.map((u, idx) => (
                    <SelectItem
                      key={`unidade-${u.id}-${idx}`}
                      value={u.id}
                    >
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {temFiltro ? (
                <Button
                  key="btn-limpar"
                  variant="ghost"
                  size="sm"
                  onClick={limpar}
                  disabled={isPending}
                  className="h-9"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Limpar
                </Button>
              ) : null}
              <Button
                key="btn-aplicar"
                onClick={aplicar}
                disabled={isPending}
                size="sm"
                className="h-9"
              >
                {isPending ? 'Aplicando...' : 'Aplicar'}
              </Button>
            </div>
          </div>

          {temFiltro ? (
            <p className="text-xs text-slate-500 w-full mt-1">
              {descricaoFiltro}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}