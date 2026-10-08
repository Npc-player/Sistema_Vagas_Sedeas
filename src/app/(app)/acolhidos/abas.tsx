// src/app/(app)/acolhidos/abas.tsx
'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AbasProps {
  abaAtual: 'em-acolhimento' | 'sem-acolhimento';
  totalEmAcolhimento: number;
  totalSemAcolhimento: number;
}

export function AbasAcolhidos({
  abaAtual,
  totalEmAcolhimento,
  totalSemAcolhimento,
}: AbasProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefPara(aba: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('aba', aba);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="border-b border-slate-200 mb-6">
      <div className="flex gap-1">
        <Link
          href={hrefPara('em-acolhimento')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            abaAtual === 'em-acolhimento'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          Em acolhimento
          <span
            className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-xs font-semibold',
              abaAtual === 'em-acolhimento'
                ? 'bg-teal-100 text-teal-800'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {totalEmAcolhimento}
          </span>
        </Link>

        <Link
          href={hrefPara('sem-acolhimento')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            abaAtual === 'sem-acolhimento'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          Sem acolhimento
          <span
            className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-xs font-semibold',
              abaAtual === 'sem-acolhimento'
                ? 'bg-teal-100 text-teal-800'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {totalSemAcolhimento}
          </span>
        </Link>
      </div>
    </div>
  );
}