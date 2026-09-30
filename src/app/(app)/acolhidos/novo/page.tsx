// src/app/(app)/acolhidos/novo/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { FormularioAcolhido } from './formulario';
import { ArrowLeft } from 'lucide-react';

export default async function NovoAcolhidoPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/acolhidos"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para acolhidos
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Cadastrar pessoa acolhida
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          O cadastro cria o registro da pessoa. A vinculação a uma unidade de
          acolhimento é feita em um segundo passo (admissão).
        </p>
      </div>

      <FormularioAcolhido />
    </div>
  );
}