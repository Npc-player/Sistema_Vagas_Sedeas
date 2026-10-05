// src/app/(app)/relatorios/filtros.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSearch, X } from 'lucide-react';

export interface UnidadeOption {
  id: string;
  nome: string;
  tipo: string;
}

interface FiltrosRelatorioProps {
  unidades: UnidadeOption[];
}

const TIPOS_RELATORIO = [
  { value: 'CENTRAL_INSTITUCIONAL', label: 'Central de Regulação — Institucional' },
  { value: 'CENTRAL_PROVISAO', label: 'Central de Regulação — Provisório' },
  { value: 'FLUXO_DETALHADO', label: 'Fluxo Mensal Detalhado (nominal)' },
];

const TIPOS_PERIODO = [
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
];

export function FiltrosRelatorio({ unidades }: FiltrosRelatorioProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const hoje = new Date().toISOString().split('T')[0];
  const primeiroDiaMes = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split('T')[0];

  const [tipoRelatorio, setTipoRelatorio] = useState(
    searchParams.get('tipoRelatorio') ?? 'CENTRAL_INSTITUCIONAL'
  );
  const [tipoPeriodo, setTipoPeriodo] = useState(
    searchParams.get('tipoPeriodo') ?? 'MENSAL'
  );
  const [dataBase, setDataBase] = useState(
    searchParams.get('dataBase') ?? hoje
  );
  const [dataInicio, setDataInicio] = useState(
    searchParams.get('dataInicio') ?? primeiroDiaMes
  );
  const [dataFim, setDataFim] = useState(searchParams.get('dataFim') ?? hoje);
  const [unidadeId, setUnidadeId] = useState(
    searchParams.get('unidadeId') ?? ''
  );

  function aplicar() {
    const params = new URLSearchParams();
    params.set('tipoRelatorio', tipoRelatorio);
    params.set('tipoPeriodo', tipoPeriodo);
    params.set('dataBase', dataBase);
    if (tipoPeriodo === 'PERSONALIZADO') {
      params.set('dataInicio', dataInicio);
      params.set('dataFim', dataFim);
    }
    if (unidadeId) params.set('unidadeId', unidadeId);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function limpar() {
    setTipoRelatorio('CENTRAL_INSTITUCIONAL');
    setTipoPeriodo('MENSAL');
    setDataBase(hoje);
    setDataInicio(primeiroDiaMes);
    setDataFim(hoje);
    setUnidadeId('');
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <Card className="border-slate-200 mb-6">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Parâmetros do relatório
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="tipo-relatorio">Tipo de relatório</Label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger id="tipo-relatorio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_RELATORIO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo-periodo">Período</Label>
            <Select value={tipoPeriodo} onValueChange={setTipoPeriodo}>
              <SelectTrigger id="tipo-periodo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PERIODO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipoPeriodo !== 'PERSONALIZADO' && (
            <div>
              <Label htmlFor="data-base">
                {tipoPeriodo === 'MENSAL'
                  ? 'Mês de referência'
                  : tipoPeriodo === 'TRIMESTRAL'
                    ? 'Trimestre de referência'
                    : 'Ano de referência'}
              </Label>
              <Input
                id="data-base"
                type="date"
                value={dataBase}
                onChange={(e) => setDataBase(e.target.value)}
              />
            </div>
          )}

          {tipoPeriodo === 'PERSONALIZADO' && (
            <>
              <div>
                <Label htmlFor="data-inicio">Data início</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data-fim">Data fim</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </>
          )}

          {tipoRelatorio === 'FLUXO_DETALHADO' && (
            <div className="lg:col-span-2">
              <Label htmlFor="unidade">Unidade (opcional)</Label>
              <Select
                value={unidadeId || '__all__'}
                onValueChange={(v) => setUnidadeId(v === '__all__' ? '' : v)}
              >
                <SelectTrigger id="unidade">
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as unidades</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={limpar} disabled={isPending}>
            <X className="w-3.5 h-3.5 mr-1" />
            Limpar
          </Button>
          <Button onClick={aplicar} disabled={isPending} size="sm">
            {isPending ? 'Gerando...' : 'Gerar relatório'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}