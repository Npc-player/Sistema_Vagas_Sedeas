// src/app/(app)/unidades/[id]/editar/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { EditarUnidadeForm } from './editar-form';
import { ArrowLeft } from 'lucide-react';

export default async function EditarUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!can.editarUnidade(session.role)) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: unidade } = await supabase
    .from('unidades')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!unidade) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/unidades/${id}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para detalhes
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Editar unidade
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Altere os dados abaixo. Mudanças na capacidade ajustam as vagas
          automaticamente.
        </p>
      </div>

      <EditarUnidadeForm
        defaultValues={{
          id: unidade.id,
          nome: unidade.nome,
          tipo: unidade.tipo,
          cnpj: unidade.cnpj ?? '',
          logradouro: unidade.logradouro,
          numero: unidade.numero,
          complemento: unidade.complemento ?? '',
          bairro: unidade.bairro,
          cidade: unidade.cidade,
          uf: unidade.uf,
          cep: unidade.cep,
          telefoneInstitucional: unidade.telefone_institucional,
          emailInstitucional: unidade.email_institucional,
          capacidadeTotal: unidade.capacidade_total,
          responsavelNome: unidade.responsavel_nome,
          responsavelTelefone: unidade.responsavel_telefone,
          responsavelEmail: unidade.responsavel_email,
          asVaraInfancia: unidade.as_vara_infancia ?? '',
          psicVaraInfancia: unidade.psic_vara_infancia ?? '',
          asCreas: unidade.as_creas ?? '',
        }}
      />
    </div>
  );
}
