// src/app/(app)/usuarios/novo/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { listarUnidadesParaSelect } from '@/lib/rbac/queries';
import { FormularioUsuario } from './formulario';
import { ArrowLeft } from 'lucide-react';

export default async function NovoUsuarioPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.verAuditoria(session.role)) redirect('/dashboard');

  const unidades = await listarUnidadesParaSelect();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/usuarios"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para usuários
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Novo usuário
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          O sistema gera uma senha temporária automaticamente. O usuário deverá
          alterá-la no primeiro acesso.
        </p>
      </div>

      <FormularioUsuario unidades={unidades} />
    </div>
  );
}