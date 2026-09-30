// src/app/(app)/acolhimentos/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  BedDouble,
  User,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

const LABEL_MOTIVO: Record<string, string> = {
  VULNERABILIDADE_SOCIAL: 'Vulnerabilidade social',
  NEGLIGENCIA_FAMILIAR: 'Negligência familiar',
  VIOLENCIA_DOMESTICA: 'Violência doméstica',
  ABANDONO: 'Abandono',
  DEPENDENCIA_QUIMICA: 'Dependência química',
  SAUDE_MENTAL: 'Saúde mental',
  SITUACAO_RUA: 'Situação de rua',
  DETERMINACAO_JUDICIAL: 'Determinação judicial',
  OUTRO: 'Outro',
};

const LABEL_MOTIVO_DESACOLHIMENTO: Record<string, string> = {
  REINTEGRACAO_FAMILIAR: 'Reintegração familiar',
  TRANSFERENCIA: 'Transferência',
  MAIORIDADE: 'Maioridade',
  OBITO: 'Óbito',
  DECISAO_JUDICIAL: 'Decisão judicial',
};

interface AcolhimentoDetalhe {
  id: string;
  protocolo: string;
  acolhido_id: string;
  acolhido_nome: string;
  acolhido_data_nascimento: string;
  acolhido_nome_social: string | null;
  unidade_id: string;
  unidade_nome: string;
  unidade_tipo: string;
  unidade_cidade: string;
  unidade_uf: string;
  data_acolhimento: string;
  motivo_acolhimento: string;
  motivo_detalhe: string | null;
  regime: string;
  data_desacolhimento: string | null;
  motivo_desacolhimento: string | null;
  motivo_desacolhimento_detalhe: string | null;
  ativo: boolean;
  numero_leito: number | null;
  criado_em: string;
  atualizado_em: string;
}

export default async function DetalheAcolhimentoPage({
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
      ac.acolhido_id,
      a.nome_completo AS acolhido_nome,
      a.nome_social AS acolhido_nome_social,
      a.data_nascimento AS acolhido_data_nascimento,
      ac.unidade_id,
      u.nome AS unidade_nome,
      u.tipo AS unidade_tipo,
      u.cidade AS unidade_cidade,
      u.uf AS unidade_uf,
      ac.data_acolhimento,
      ac.motivo_acolhimento,
      ac.motivo_detalhe,
      ac.regime,
      ac.data_desacolhimento,
      ac.motivo_desacolhimento,
      ac.motivo_desacolhimento_detalhe,
      ac.ativo,
      v.numero_leito,
      ac.created_at AS criado_em,
      ac.updated_at AS atualizado_em
    FROM acolhimentos ac
    JOIN acolhidos a ON a.id = ac.acolhido_id
    JOIN unidades u ON u.id = ac.unidade_id
    LEFT JOIN vagas v ON v.acolhimento_atual_id = ac.id
    WHERE ac.id = ${id}
    LIMIT 1
  `);

  const acolhimento = (rows as unknown as AcolhimentoDetalhe[])[0];
  if (!acolhimento) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          href="/acolhimentos"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para acolhimentos
        </Link>

        <div className="flex items-start justify-between gap-4 mt-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {acolhimento.acolhido_nome}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="font-mono text-xs"
                >
                  {acolhimento.protocolo}
                </Badge>
                {acolhimento.ativo ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                    Em acolhimento
                  </Badge>
                ) : (
                  <Badge variant="secondary">Encerrado</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pessoa acolhida */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              Pessoa acolhida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Nome completo
              </p>
              <p className="text-slate-900 mt-0.5">
                {acolhimento.acolhido_nome}
              </p>
            </div>
            {acolhimento.acolhido_nome_social && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Nome social
                </p>
                <p className="text-slate-900 mt-0.5">
                  {acolhimento.acolhido_nome_social}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Data de nascimento
              </p>
              <p className="text-slate-900 mt-0.5">
                {new Date(
                  acolhimento.acolhido_data_nascimento + 'T00:00:00'
                ).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Link href={`/acolhidos/${acolhimento.acolhido_id}`}>
              <Button variant="outline" size="sm" className="mt-2">
                <User className="w-3.5 h-3.5 mr-1.5" />
                Ver ficha completa
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Unidade */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              Unidade de acolhimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Unidade
              </p>
              <p className="text-slate-900 mt-0.5">
                {acolhimento.unidade_nome}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {acolhimento.unidade_cidade}/{acolhimento.unidade_uf}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Tipo
              </p>
              <p className="text-slate-900 mt-0.5">
                {acolhimento.unidade_tipo}
              </p>
            </div>
            {acolhimento.numero_leito && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Leito
                </p>
                <p className="text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5 text-teal-700" />
                  Leito {acolhimento.numero_leito}
                </p>
              </div>
            )}
            <Link href={`/vagas/${acolhimento.unidade_id}`}>
              <Button variant="outline" size="sm" className="mt-2">
                <BedDouble className="w-3.5 h-3.5 mr-1.5" />
                Ver mapa de leitos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Dados da admissão */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              Dados da admissão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Data do acolhimento
              </p>
              <p className="text-slate-900 mt-0.5">
                {new Date(
                  acolhimento.data_acolhimento + 'T00:00:00'
                ).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Regime
              </p>
              <p className="text-slate-900 mt-0.5">
                {LABEL_REGIME[acolhimento.regime] ?? acolhimento.regime}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Motivo
              </p>
              <p className="text-slate-900 mt-0.5">
                {LABEL_MOTIVO[acolhimento.motivo_acolhimento] ??
                  acolhimento.motivo_acolhimento}
              </p>
            </div>
            {acolhimento.motivo_detalhe && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Detalhamento
                </p>
                <p className="text-slate-900 mt-0.5 whitespace-pre-wrap">
                  {acolhimento.motivo_detalhe}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desacolhimento (se aplicável) */}
        {!acolhimento.ativo && acolhimento.data_desacolhimento && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Encerramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Data do desacolhimento
                </p>
                <p className="text-slate-900 mt-0.5">
                  {new Date(
                    acolhimento.data_desacolhimento + 'T00:00:00'
                  ).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {acolhimento.motivo_desacolhimento && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Motivo
                  </p>
                  <p className="text-slate-900 mt-0.5">
                    {LABEL_MOTIVO_DESACOLHIMENTO[
                      acolhimento.motivo_desacolhimento
                    ] ?? acolhimento.motivo_desacolhimento}
                  </p>
                </div>
              )}
              {acolhimento.motivo_desacolhimento_detalhe && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Detalhamento
                  </p>
                  <p className="text-slate-900 mt-0.5 whitespace-pre-wrap">
                    {acolhimento.motivo_desacolhimento_detalhe}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Registro criado em{' '}
          {new Date(acolhimento.criado_em).toLocaleDateString('pt-BR')} ·
          Última atualização em{' '}
          {new Date(acolhimento.atualizado_em).toLocaleDateString('pt-BR')}.
          Todas as operações sobre este registro são auditadas.
        </p>
      </div>
    </div>
  );
}