// src/app/(app)/vagas/[unidadeId]/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import {
  MapaInterativo,
  type VagaInterativa,
  type StatusVaga,
} from './mapa-interativo';
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
  Building2,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
} from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'R.I.',
};

export default async function VagasUnidadePage({
  params,
}: {
  params: Promise<{ unidadeId: string }>;
}) {
  const { unidadeId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');

  const podeEditar = can.editarVagas(session.role);

  const supabase = await createClient();

  const { data: unidade } = await supabase
    .from('unidades')
    .select('id, nome, tipo, cidade, uf, ativo, capacidade_total')
    .eq('id', unidadeId)
    .maybeSingle();

  if (!unidade) notFound();

  const { data: vagasRaw } = await supabase
    .from('vagas')
    .select('id, numero_leito, status, motivo_bloqueio, prazo_bloqueio')
    .eq('unidade_id', unidadeId)
    .order('numero_leito');

  const vagas: VagaInterativa[] = (vagasRaw ?? []).map((v) => ({
    id: v.id,
    numeroLeito: v.numero_leito,
    status: v.status as StatusVaga,
    motivoBloqueio: v.motivo_bloqueio,
    prazoBloqueio: v.prazo_bloqueio,
  }));

  const disponiveis = vagas.filter((v) => v.status === 'DISPONIVEL').length;
  const ocupadas = vagas.filter((v) => v.status === 'OCUPADA').length;
  const bloqueadas = vagas.filter((v) => v.status === 'BLOQUEADA').length;
  const taxa =
    vagas.length > 0 ? Math.round((ocupadas / vagas.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          href="/vagas"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para controle de vagas
        </Link>

        <div className="flex items-start justify-between gap-4 mt-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {unidade.nome}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {LABEL_TIPO[unidade.tipo] ?? unidade.tipo}
                </Badge>
                <span className="text-xs text-slate-500">
                  {unidade.cidade}/{unidade.uf}
                </span>
                {!unidade.ativo && (
                  <Badge variant="secondary" className="text-[10px]">
                    Unidade inativa
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso unidade inativa */}
      {!unidade.ativo && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>Atenção:</strong> esta unidade está inativa. As vagas não
            podem ser bloqueadas ou desbloqueadas até que a unidade seja
            reativada.
          </p>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <BedDouble className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Total
              </p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {vagas.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Disponíveis
              </p>
            </div>
            <p className="text-2xl font-semibold text-emerald-700">
              {disponiveis}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-rose-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Ocupadas
              </p>
            </div>
            <p className="text-2xl font-semibold text-rose-700">{ocupadas}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Bloqueadas
              </p>
            </div>
            <p className="text-2xl font-semibold text-amber-700">
              {bloqueadas}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Ocupação
              </p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{taxa}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Mapa interativo */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-teal-700" />
            Mapa de leitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapaInterativo vagas={vagas} podeEditar={podeEditar} />
        </CardContent>
      </Card>
    </div>
  );
}