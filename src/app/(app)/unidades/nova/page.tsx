// src/app/(app)/unidades/nova/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { UnidadeForm } from './unidade-form';
import { ArrowLeft } from 'lucide-react';

export default async function NovaUnidadePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!can.criarUnidade(session.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/unidades"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para unidades
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">
          Nova unidade de acolhimento
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Preencha os dados abaixo. As vagas serão criadas automaticamente
          conforme a capacidade informada.
        </p>
      </div>

      <UnidadeForm />
    </div>
  );
}