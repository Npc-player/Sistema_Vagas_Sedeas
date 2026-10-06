// src/app/(app)/unidades/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { MapaVagas, type VagaResumo, type StatusVaga } from '@/components/features/mapa-vagas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BotaoStatusUnidade } from './botao-status';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  Building2,
  BedDouble,
  Pencil,
} from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI — Instituição de Longa Permanência para Idosos',
  SAICA: 'SAICA — Acolhimento para Crianças e Adolescentes',
  CENTRO_DIA_IDOSO: 'Centro Dia do Idoso',
  SAI: 'SAI — Serviço de Acolhimento Institucional',
  RESIDENCIA_INCLUSIVA: 'R.I. — Residência Inclusiva',
};

export default async function DetalheUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!can.listarUnidades(session.role)) {
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

  const { data: vagasRaw } = await supabase
    .from('vagas')
    .select('id, numero_leito, status, motivo_bloqueio, prazo_bloqueio')
    .eq('unidade_id', id)
    .order('numero_leito', { ascending: true });

  const vagas: VagaResumo[] = (vagasRaw ?? []).map((v) => ({
    id: v.id,
    numeroLeito: v.numero_leito,
    status: v.status as StatusVaga,
    motivoBloqueio: v.motivo_bloqueio,
    prazoBloqueio: v.prazo_bloqueio,
  }));

  const ocupadas = vagas.filter((v) => v.status === 'OCUPADA').length;
  const disponiveis = vagas.filter((v) => v.status === 'DISPONIVEL').length;
  const taxaOcupacao =
    vagas.length > 0 ? Math.round((ocupadas / vagas.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          href="/unidades"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para unidades
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
                {unidade.ativo ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>
            </div>
          </div>

          {can.editarUnidade(session.role) && (
            <div className="flex items-center gap-2">
              <BotaoStatusUnidade
                unidadeId={unidade.id}
                unidadeNome={unidade.nome}
                ativo={unidade.ativo}
              />
              <Link href={`/unidades/${id}/editar`}>
                <Button variant="outline">
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Editar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Capacidade
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  {unidade.capacidade_total}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    vagas
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Disponíveis
                </p>
                <p className="text-xl font-semibold text-emerald-700">
                  {disponiveis}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Taxa de ocupação
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  {taxaOcupacao}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: dados */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-900">
                    {unidade.logradouro}, {unidade.numero}
                    {unidade.complemento ? ` — ${unidade.complemento}` : ''}
                  </p>
                  <p className="text-slate-600">
                    {unidade.bairro} — {unidade.cidade}/{unidade.uf}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    CEP {unidade.cep}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Contato institucional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900">
                  {unidade.telefone_institucional}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900 break-all">
                  {unidade.email_institucional}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Responsável técnico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900">
                  {unidade.responsavel_nome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900">
                  {unidade.responsavel_telefone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900 break-all">
                  {unidade.responsavel_email}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Equipe técnica de referência */}
          {(unidade.as_vara_infancia ||
            unidade.psic_vara_infancia ||
            unidade.as_creas ||
            unidade.psic_creas) && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  Equipe técnica de referência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Assistente Social — Vara da Infância
                  </p>
                  <p className="text-slate-900 mt-0.5">
                    {unidade.as_vara_infancia ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Psicólogo(a) — Vara da Infância
                  </p>
                  <p className="text-slate-900 mt-0.5">
                    {unidade.psic_vara_infancia ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Assistente Social — CREAS
                  </p>
                  <p className="text-slate-900 mt-0.5">
                    {unidade.as_creas ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Psicólogo(a) — CREAS
                  </p>
                  <p className="text-slate-900 mt-0.5">
                    {unidade.psic_creas ?? '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita: mapa de vagas */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-teal-700" />
                Mapa de vagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapaVagas vagas={vagas} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}