// src/app/(app)/acolhimentos/[id]/editar/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
import { FormularioEdicaoAcolhimento } from './formulario-edicao';
import { ArrowLeft } from 'lucide-react';
import type { EditarAcolhimentoInput } from '@/lib/validations/acolhimento';

interface AcolhimentoEdicao {
  id: string;
  protocolo: string;
  ativo: boolean;
  data_acolhimento: string;
  motivo_acolhimento: string;
  motivo_detalhe: string | null;
  regime: string;
  numero_processo: string | null;
  numero_medida_protetiva: string | null;
  numero_guia_acolhimento: string | null;
  territorio: string | null;
  as_vara_infancia: string | null;
  psic_vara_infancia: string | null;
  as_creas: string | null;
  unidade_id: string;
  unidade_nome: string;
  unidade_as_vara: string | null;
  unidade_psic_vara: string | null;
  unidade_as_creas: string | null;
}

export default async function EditarAcolhimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  const rows = await db.execute(sql`
    SELECT
      ac.id,
      ac.protocolo,
      ac.ativo,
      ac.data_acolhimento,
      ac.motivo_acolhimento,
      ac.motivo_detalhe,
      ac.regime::text AS regime,
      ac.numero_processo,
      ac.numero_medida_protetiva,
      ac.numero_guia_acolhimento,
      ac.territorio,
      ac.as_vara_infancia,
      ac.psic_vara_infancia,
      ac.as_creas,
      ac.unidade_id,
      u.nome AS unidade_nome,
      u.as_vara_infancia AS unidade_as_vara,
      u.psic_vara_infancia AS unidade_psic_vara,
      u.as_creas AS unidade_as_creas
    FROM acolhimentos ac
    INNER JOIN unidades u ON u.id = ac.unidade_id
    WHERE ac.id = ${id}
    LIMIT 1
  `);

  const acolhimento = (rows as unknown as AcolhimentoEdicao[])[0];
  if (!acolhimento) notFound();

  if (!acolhimento.ativo) {
    redirect(`/acolhimentos/${id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/acolhimentos/${id}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para o acolhimento
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Editar acolhimento
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Protocolo{' '}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            {acolhimento.protocolo}
          </span>{' '}
          · Unidade: {acolhimento.unidade_nome}
        </p>
      </div>

      <FormularioEdicaoAcolhimento
        defaultValues={{
          id: acolhimento.id,
          dataAcolhimento: acolhimento.data_acolhimento,
          motivo:
            acolhimento.motivo_acolhimento as EditarAcolhimentoInput['motivo'],
          motivoDetalhe: acolhimento.motivo_detalhe ?? '',
          regime: acolhimento.regime as EditarAcolhimentoInput['regime'],
          numeroProcesso: acolhimento.numero_processo ?? '',
          numeroMedidaProtetiva: acolhimento.numero_medida_protetiva ?? '',
          numeroGuiaAcolhimento: acolhimento.numero_guia_acolhimento ?? '',
          territorio: acolhimento.territorio ?? '',
          // Se o acolhimento não tem equipe própria, pré-preenche com a da unidade
          asVaraInfancia:
            acolhimento.as_vara_infancia ??
            acolhimento.unidade_as_vara ??
            '',
          psicVaraInfancia:
            acolhimento.psic_vara_infancia ??
            acolhimento.unidade_psic_vara ??
            '',
          asCreas: acolhimento.as_creas ?? acolhimento.unidade_as_creas ?? '',
        }}
      />
    </div>
  );
}