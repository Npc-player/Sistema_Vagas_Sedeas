// src/components/layout/nav-mobile.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  LayoutDashboard,
  LayoutGrid,
  Building2,
  BedDouble,
  Users,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ItemNav, IconeKey } from './nav-principal';

const ICONES: Record<IconeKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  modulos: LayoutGrid,
  unidades: Building2,
  vagas: BedDouble,
  pessoas: Users,
  acolhimentos: ClipboardList,
  auditoria: ShieldCheck,
};

interface NavMobileProps {
  itens: ItemNav[];
}

export function NavMobile({ itens }: NavMobileProps) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  function isAtivo(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className="md:hidden">
      <DropdownMenu open={aberto} onOpenChange={setAberto}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-2 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {itens.map((item) => {
            const Icone = ICONES[item.icone];
            const ativo = isAtivo(item.href);
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={`
                    flex items-center gap-2 cursor-pointer
                    ${ativo ? 'bg-teal-50 text-teal-700 font-medium' : ''}
                  `}
                >
                  <Icone className="w-4 h-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}