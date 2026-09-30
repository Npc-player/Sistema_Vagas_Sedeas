// src/app/(app)/acolhidos/[id]/editar/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { buscarAcolhidoPorId } from '@/lib/crypto/acolhido';
import { FormularioEdicao } from './formulario';
import { ArrowLeft } from 'lucide-react';

export default async function EditarAcolhidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  // Para editar, precisamos dos campos sensíveis descriptografados
  const acolhido = await buscarAcolhidoPorId(id, true);

  if (!acolhido) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/acolhidos/${id}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para detalhes
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Editar dados
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Alterações nos dados sensíveis são criptografadas e registradas em
          auditoria.
        </p>
      </div>

      <FormularioEdicao
        defaultValues={{
          id: acolhido.id,
          nomeCompleto: acolhido.nomeCompleto,
          nomeSocial: acolhido.nomeSocial ?? '',
          dataNascimento: acolhido.dataNascimento,
          nomeMae: acolhido.nomeMae ?? '',
          nomePai: acolhido.nomePai ?? '',
          cpf: acolhido.cpf ?? '',
          rg: acolhido.rg ?? '',
          alergias: acolhido.alergias ?? '',
          comorbidades: acolhido.comorbidades ?? '',
          familiaHistorico: acolhido.familiaHistorico ?? '',
        }}
      />
    </div>
  );
}