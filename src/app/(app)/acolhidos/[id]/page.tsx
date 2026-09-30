// src/app/(app)/acolhidos/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { buscarAcolhidoPorId } from '@/lib/crypto/acolhido';
import { calcularIdade } from '@/lib/validations/acolhido';
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
  User,
  Calendar,
  Users,
  FileText,
  HeartPulse,
  ShieldAlert,
  Pencil,
} from 'lucide-react';

export default async function DetalheAcolhidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  // ADMIN_MUNICIPAL, GESTOR e OPERADOR veem dados sensíveis.
  // (Futuramente, JUDICIARIO/MP terá regra própria com mascaramento.)
  const incluirSensiveis =
    session.role === 'ADMIN_MUNICIPAL' ||
    session.role === 'GESTOR_ACOLHIMENTO' ||
    session.role === 'OPERADOR';

  const acolhido = await buscarAcolhidoPorId(id, incluirSensiveis);

  if (!acolhido) notFound();

  const idade = calcularIdade(acolhido.dataNascimento);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          href="/acolhidos"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para acolhidos
        </Link>

        <div className="flex items-start justify-between gap-4 mt-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {acolhido.nomeCompleto}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {acolhido.nomeSocial && (
                  <span className="text-xs text-slate-500">
                    Nome social: {acolhido.nomeSocial}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {idade} anos
                </Badge>
              </div>
            </div>
          </div>

          {can.cadastrarAcolhido(session.role) && (
            <Link href={`/acolhidos/${id}/editar`}>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-1.5" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Aviso LGPD */}
      {incluirSensiveis && (
        <div className="mb-6 bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-sm text-teal-900">
            <p className="font-medium mb-0.5">Acesso a dados sensíveis</p>
            <p className="text-xs leading-relaxed">
              Você está visualizando CPF, RG e dados de saúde. Este acesso é
              registrado em trilha de auditoria imutável (LGPD Art. 37).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados pessoais */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Data de nascimento
              </p>
              <p className="text-slate-900 mt-0.5">
                {new Date(
                  acolhido.dataNascimento + 'T00:00:00'
                ).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Nome da mãe
              </p>
              <p className="text-slate-900 mt-0.5">
                {acolhido.nomeMae ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Nome do pai
              </p>
              <p className="text-slate-900 mt-0.5">
                {acolhido.nomePai ?? '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                CPF
              </p>
              <p className="text-slate-900 mt-0.5 font-mono">
                {acolhido.cpf ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                RG
              </p>
              <p className="text-slate-900 mt-0.5 font-mono">
                {acolhido.rg ?? '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Saúde */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Alergias
              </p>
              <p className="text-slate-900 mt-0.5 whitespace-pre-wrap">
                {acolhido.alergias ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Comorbidades
              </p>
              <p className="text-slate-900 mt-0.5 whitespace-pre-wrap">
                {acolhido.comorbidades ?? '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Histórico familiar */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              Histórico familiar e rede de apoio
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-slate-900 whitespace-pre-wrap">
              {acolhido.familiaHistorico ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé com metadados */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          Cadastro criado em{' '}
          {new Date(acolhido.createdAt).toLocaleDateString('pt-BR')} ·
          Última atualização em{' '}
          {new Date(acolhido.updatedAt).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}