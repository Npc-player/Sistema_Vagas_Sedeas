// src/app/(app)/acolhimentos/novo/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
import { FormularioAdmissao } from './formulario';
import { ArrowLeft } from 'lucide-react';

export interface AcolhidoOption {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
}

export interface UnidadeOption {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  vagas: VagaOption[];
}

export interface VagaOption {
  id: string;
  numeroLeito: number;
}

export default async function NovaAdmissaoPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  // 1. Acolhidos SEM acolhimento ativo
  const acolhidosRaw = await db.execute(sql`
    SELECT
      a.id,
      a.nome_completo AS "nomeCompleto",
      a.data_nascimento AS "dataNascimento"
    FROM acolhidos a
    WHERE NOT EXISTS (
      SELECT 1 FROM acolhimentos ac
      WHERE ac.acolhido_id = a.id AND ac.ativo = true
    )
    ORDER BY a.nome_completo ASC
  `);
  const acolhidos = acolhidosRaw as unknown as AcolhidoOption[];

  // 2. Unidades ativas + vagas DISPONIVEL
  const linhasRaw = await db.execute(sql`
    SELECT
      u.id AS unidade_id,
      u.nome AS unidade_nome,
      u.tipo AS unidade_tipo,
      u.cidade AS unidade_cidade,
      u.uf AS unidade_uf,
      v.id AS vaga_id,
      v.numero_leito AS vaga_numero
    FROM unidades u
    LEFT JOIN vagas v
      ON v.unidade_id = u.id
      AND v.status = 'DISPONIVEL'
    WHERE u.ativo = true
    ORDER BY u.nome ASC, v.numero_leito ASC
  `);

  const linhas = linhasRaw as unknown as Array<{
    unidade_id: string;
    unidade_nome: string;
    unidade_tipo: string;
    unidade_cidade: string;
    unidade_uf: string;
    vaga_id: string | null;
    vaga_numero: number | null;
  }>;

  // 3. Agrupa por unidade
  const mapa = new Map<string, UnidadeOption>();
  for (const l of linhas) {
    let unidade = mapa.get(l.unidade_id);
    if (!unidade) {
      unidade = {
        id: l.unidade_id,
        nome: l.unidade_nome,
        tipo: l.unidade_tipo,
        cidade: l.unidade_cidade,
        uf: l.unidade_uf,
        vagas: [],
      };
      mapa.set(l.unidade_id, unidade);
    }
    if (l.vaga_id && l.vaga_numero) {
      unidade.vagas.push({
        id: l.vaga_id,
        numeroLeito: l.vaga_numero,
      });
    }
  }
  const unidades = Array.from(mapa.values());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/acolhimentos"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para acolhimentos
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-2">
          Registrar admissão
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Vincule uma pessoa a uma vaga de acolhimento. A vaga será marcada
          como ocupada.
        </p>
      </div>

      <FormularioAdmissao acolhidos={acolhidos} unidades={unidades} />
    </div>
  );
}
