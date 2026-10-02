// src/app/(app)/dpo/page.tsx
import { redirect } from 'next/navigation';
import { getSession, can } from '@/lib/rbac';
import {
  getDpoConfiguracao,
  listarRequisicoes,
  getContadoresRequisicoes,
} from '@/lib/dpo/queries';
import { FormularioConfigDpo } from './formulario-config';
import { ListaRequisicoes } from './lista-requisicoes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShieldCheck,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';

export default async function DpoPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.verAuditoria(session.role)) redirect('/dashboard');

  // Sequencial (pool de 1 conexão evita ECONNRESET com Supavisor)
  const config = await getDpoConfiguracao();
  const requisicoes = await listarRequisicoes({ porPagina: 30 });
  const contadores = await getContadoresRequisicoes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Governança LGPD
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-teal-700" />
          Encarregado pelo Tratamento de Dados
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Canal de comunicação com titulares de dados (LGPD Art. 41) e
          configuração do Encarregado nomeado.
        </p>
      </div>

      {/* Aviso institucional */}
      <div className="mb-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
        <p className="text-sm text-teal-900">
          <strong>Art. 41 da LGPD:</strong> o Encarregado é o canal de
          comunicação entre o controlador, os titulares dos dados e a
          Autoridade Nacional de Proteção de Dados (ANPD). Esta página permite
          configurar o responsável e gerenciar as requisições recebidas.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Total
              </p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {contadores.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Recebidas
              </p>
            </div>
            <p className="text-2xl font-semibold text-blue-700">
              {contadores.recebidas}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Em análise
              </p>
            </div>
            <p className="text-2xl font-semibold text-amber-700">
              {contadores.emAnalise}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Respondidas
              </p>
            </div>
            <p className="text-2xl font-semibold text-emerald-700">
              {contadores.respondidas}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Vencendo
              </p>
            </div>
            <p className="text-2xl font-semibold text-rose-700">
              {contadores.vencendo}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Próximos 5 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de vencimento */}
      {contadores.vencendo > 0 && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-900">
            <p className="font-medium">
              {contadores.vencendo}{' '}
              {contadores.vencendo === 1
                ? 'requisição próxima do prazo de resposta'
                : 'requisições próximas do prazo de resposta'}
            </p>
            <p className="text-xs mt-0.5">
              Recomenda-se responder em até 15 dias corridos a partir do
              recebimento.
            </p>
          </div>
        </div>
      )}

      {/* Configuração do DPO */}
      <div className="mb-6">
        <FormularioConfigDpo
          defaultValues={{
            nomeCompleto: config?.nomeCompleto ?? '',
            email: config?.email ?? '',
            telefone: config?.telefone ?? '',
            cargo: config?.cargo ?? '',
            endereco: config?.endereco ?? '',
            horarioAtendimento: config?.horarioAtendimento ?? '',
            observacoes: config?.observacoes ?? '',
          }}
          podeEditar={can.verAuditoria(session.role)}
        />
      </div>

      {/* Requisições */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-teal-700" />
            Requisições LGPD ({requisicoes.total})
          </CardTitle>
          <CardDescription>
            Registros de solicitações de titulares de dados (acesso, correção,
            exclusão, portabilidade).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ListaRequisicoes requisicoes={requisicoes.registros} />
        </CardContent>
      </Card>
    </div>
  );
}