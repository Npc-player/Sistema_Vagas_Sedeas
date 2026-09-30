// src/components/layout/nav-principal.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  Building2,
  BedDouble,
  Users,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export type IconeKey =
  | 'dashboard'
  | 'modulos'
  | 'unidades'
  | 'vagas'
  | 'pessoas'
  | 'acolhimentos'
  | 'auditoria';

const ICONES: Record<IconeKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  modulos: LayoutGrid,
  unidades: Building2,
  vagas: BedDouble,
  pessoas: Users,
  acolhimentos: ClipboardList,
  auditoria: ShieldCheck,
};

export interface ItemNav {
  label: string;
  href: string;
  icone: IconeKey;
}

interface NavPrincipalProps {
  itens: ItemNav[];
}

export function NavPrincipal({ itens }: NavPrincipalProps) {
  const pathname = usePathname();

  function isAtivo(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="hidden md:flex items-center gap-1">
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        const ativo = isAtivo(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative px-3 py-2 text-sm font-medium rounded-md transition-colors
              flex items-center gap-1.5
              ${
                ativo
                  ? 'text-teal-700 bg-teal-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            <Icone className="w-4 h-4" />
            {item.label}
            {ativo && (
              <span className="absolute -bottom-4 left-3 right-3 h-0.5 bg-teal-600 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}