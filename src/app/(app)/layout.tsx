// src/app/(app)/layout.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/rbac';
import { UserMenu } from '@/components/layout/user-menu';
import { NavPrincipal, type ItemNav } from '@/components/layout/nav-principal';
import { NavMobile } from '@/components/layout/nav-mobile';
import { Building2 } from 'lucide-react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const itens: ItemNav[] = [
    { label: 'Dashboard', href: '/dashboard', icone: 'dashboard' },
    { label: 'Módulos do Sistema', href: '/modulos', icone: 'modulos' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-semibold text-slate-900 leading-tight tracking-tight">
                  Controle de Vagas
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Desenvolvimento e Assistência Social
                </div>
              </div>
            </Link>

            <div className="flex-1 flex justify-center">
              <NavPrincipal itens={itens} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NavMobile itens={itens} />
              <UserMenu email={session.userEmail} role={session.role} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}