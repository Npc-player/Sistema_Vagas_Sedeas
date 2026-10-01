// src/components/layout/user-menu.tsx
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import Link from 'next/link';

interface UserMenuProps {
  email: string;
  role: string;
}

const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

export function UserMenu({ email, role }: UserMenuProps) {
  // Pega as duas primeiras letras do e-mail para o avatar
  const initials = email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-full">
        <Avatar className="h-9 w-9 cursor-pointer border border-slate-200 hover:border-teal-300 transition-colors">
          <AvatarFallback className="bg-teal-50 text-teal-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Conectado como
            </p>
            <p className="text-sm font-medium text-slate-900 truncate">
              {email}
            </p>
            <p className="text-xs text-teal-700 font-medium">
              {LABEL_ROLE[role] ?? role}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/perfil"
            className="flex items-center cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Meu perfil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do sistema</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}