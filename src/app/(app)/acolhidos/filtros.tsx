// src/app/(app)/acolhidos/filtros.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

export function FiltrosAcolhidos() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState(searchParams.get('nome') ?? '');
  const [cpf, setCpf] = useState(searchParams.get('cpf') ?? '');
  const [medidaProtetiva, setMedidaProtetiva] = useState(
    searchParams.get('medidaProtetiva') ?? ''
  );

  const temFiltro = !!(nome || cpf || medidaProtetiva);

  function aplicar() {
    const params = new URLSearchParams();

    const aba = searchParams.get('aba');
    if (aba) params.set('aba', aba);

    if (nome.trim()) params.set('nome', nome.trim());
    if (cpf.trim()) params.set('cpf', cpf.trim());
    if (medidaProtetiva.trim())
      params.set('medidaProtetiva', medidaProtetiva.trim());

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function limpar() {
    setNome('');
    setCpf('');
    setMedidaProtetiva('');

    const params = new URLSearchParams();
    const aba = searchParams.get('aba');
    if (aba) params.set('aba', aba);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      aplicar();
    }
  }

  return (
    <Card className="border-slate-200 mb-4">
      <CardContent className="py-2 px-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">
              Filtrar pessoas:
            </span>
          </div>

          <Input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm w-56"
          />

          <Input
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm w-40"
          />

          <Input
            placeholder="Nº medida protetiva"
            value={medidaProtetiva}
            onChange={(e) => setMedidaProtetiva(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm w-48"
          />

          <div className="flex gap-1 ml-auto">
            {temFiltro ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpar}
                disabled={isPending}
                className="h-8"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Limpar
              </Button>
            ) : null}
            <Button
              onClick={aplicar}
              disabled={isPending}
              size="sm"
              className="h-8"
            >
              {isPending ? 'Filtrando...' : 'Filtrar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}