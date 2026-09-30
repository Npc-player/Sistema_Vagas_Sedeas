// src/app/(app)/dashboard/page.tsx
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import {
  getTotaisGerais,
  getDistribuicaoPorTipo,
  getFluxo12Meses,
  getUnidadesEmAlerta,
  getTempoMedioPermanencia,
} from '@/lib/dashboard/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  BedDouble,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'R.I.',
};

const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) return null;

  // Carrega todos os indicadores em paralelo
  const [totais, porTipo, fluxo, alertas, tempoMedio] = await Promise.all([
    getTotaisGerais(),
    getDistribuicaoPorTipo(),
    getFluxo12Meses(),
    getUnidadesEmAlerta(),
    getTempoMedioPermanencia(),
  ]);

  const modulos = [
    {
      titulo: 'Unidades de Acolhimento',
      descricao: 'Cadastro e gestão das unidades.',
      href: '/unidades',
      icone: Building2,
      visivel: can.listarUnidades(session.role),
    },
    {
      titulo: 'Controle de Vagas',
      descricao: 'Ocupação e disponibilidade em tempo real.',
      href: '/vagas',
      icone: BedDouble,
      visivel:
        can.editarVagas(session.role) ||
        session.role === 'CONSELHO_MUNICIPAL' ||
        session.role === 'JUDICIARIO_MP',
    },
    {
      titulo: 'Pessoas Acolhidas',
      descricao: 'Cadastro das pessoas em atendimento.',
      href: '/acolhidos',
      icone: Users,
      visivel: can.cadastrarAcolhido(session.role),
    },
    {
      titulo: 'Acolhimentos',
      descricao: 'Admissões, desligamentos e histórico.',
      href: '/acolhimentos',
      icone: ClipboardList,
      visivel: can.cadastrarAcolhido(session.role),
    },
    {
      titulo: 'Auditoria',
      descricao: 'Trilha imutável de operações.',
      href: '/auditoria',
      icone: ShieldCheck,
      visivel: can.verAuditoria(session.role),
      emBreve: true,
    },
  ].filter((m) => m.visivel);

  // Determina a cor do gauge conforme zonas de alerta
  const corTaxa =
    totais.taxaOcupacao >= 95
      ? 'bg-rose-600'
      : totais.taxaOcupacao >= 75
        ? 'bg-amber-500'
        : 'bg-teal-600';

  // Máximo do gráfico de fluxo (para escalonar as barras)
  const maxFluxo = Math.max(
    1,
    ...fluxo.map((f) => Math.max(f.entradas, f.saidas))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Painel de Controle
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Bem-vindo(a) de volta
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Visão consolidada da rede socioassistencial ·{' '}
          {LABEL_ROLE[session.role] ?? session.role}
        </p>
      </div>

      {/* Alerta de unidades críticas */}
      {alertas.length > 0 && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-900 flex-1">
            <p className="font-medium mb-1">
              {alertas.length}{' '}
              {alertas.length === 1
                ? 'unidade com ocupação acima de 95%'
                : 'unidades com ocupação acima de 95%'}
            </p>
            <ul className="text-xs space-y-0.5 mt-1">
              {alertas.slice(0, 3).map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/vagas/${u.id}`}
                    className="underline hover:text-rose-700"
                  >
                    {u.nome}
                  </Link>{' '}
                  — {u.ocupadas}/{u.total} ({u.taxa}%)
                </li>
              ))}
              {alertas.length > 3 && (
                <li className="text-rose-700 italic">
                  + {alertas.length - 3} outras
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <BedDouble className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Capacidade instalada
              </p>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {totais.capacidadeTotal}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              leitos na rede municipal
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Vacância operacional
              </p>
            </div>
            <p className="text-3xl font-semibold text-emerald-700">
              {totais.disponiveis}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              leitos disponíveis agora
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Ocupação atual
              </p>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {totais.ocupadas}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totais.bloqueadas} bloqueadas
              {totais.reservadas > 0 && ` · ${totais.reservadas} reservadas`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-teal-700" />
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Acolhimentos ativos
              </p>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {totais.acolhimentosAtivos}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              pessoas em acolhimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de ocupação + Tempo médio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              Taxa de ocupação da rede
            </CardTitle>
            <CardDescription>
              Percentual de leitos ocupados sobre a capacidade instalada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-semibold text-slate-900">
                {totais.taxaOcupacao}%
              </span>
              <span className="text-sm text-slate-500">
                ({totais.ocupadas} de {totais.capacidadeTotal})
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${corTaxa}`}
                style={{ width: `${totais.taxaOcupacao}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 uppercase tracking-wide">
              <span>0%</span>
              <span>75%</span>
              <span>95%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              Tempo médio de permanência
            </CardTitle>
            <CardDescription>
              Média em acolhimentos já encerrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tempoMedio !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-slate-900">
                    {tempoMedio}
                  </span>
                  <span className="text-sm text-slate-500">
                    {tempoMedio === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Aproximadamente {(tempoMedio / 30).toFixed(1)} meses por
                  acolhimento.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic py-4">
                Ainda não há acolhimentos encerrados para calcular a média.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por tipo */}
      {porTipo.length > 0 && (
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              Distribuição por tipo de serviço
            </CardTitle>
            <CardDescription>
              Capacidade instalada e ocupação por modalidade socioassistencial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {porTipo.map((t) => (
                <div key={t.tipo}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {LABEL_TIPO[t.tipo] ?? t.tipo}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {t.total} leitos
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      {t.ocupadas} ocupados · {t.disponiveis} livres ·{' '}
                      <span className="text-slate-900">{t.taxa}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="h-full bg-rose-500"
                      style={{
                        width: `${
                          t.total > 0 ? (t.ocupadas / t.total) * 100 : 0
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${
                          t.total > 0 ? (t.disponiveis / t.total) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Ocupados
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Disponíveis
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fluxo de movimentação */}
      <Card className="border-slate-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            Fluxo de movimentação
          </CardTitle>
          <CardDescription>Entradas e saídas nos últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {fluxo.map((f) => {
              const altEntrada = (f.entradas / maxFluxo) * 100;
              const altSaida = (f.saidas / maxFluxo) * 100;
              return (
                <div
                  key={f.mes}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex items-end gap-0.5 w-full h-40">
                    <div
                      className="flex-1 bg-teal-600 rounded-t-sm transition-all hover:bg-teal-700"
                      style={{
                        height: `${Math.max(altEntrada, 2)}%`,
                        minHeight: '2px',
                      }}
                      title={`${f.entradas} entradas`}
                    />
                    <div
                      className="flex-1 bg-rose-400 rounded-t-sm transition-all hover:bg-rose-500"
                      style={{
                        height: `${Math.max(altSaida, 2)}%`,
                        minHeight: '2px',
                      }}
                      title={`${f.saidas} saídas`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-600" />
              Entradas
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              Saídas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Módulos do sistema
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acesse as áreas disponíveis para o seu perfil
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modulos.map((m) => {
            const Icone = m.icone;
            const conteudo = (
              <Card
                className={
                  m.emBreve
                    ? 'h-full border-slate-200 border-dashed bg-slate-50/50'
                    : 'h-full border-slate-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 group cursor-pointer'
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={
                        m.emBreve
                          ? 'w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center'
                          : 'w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-100 transition-colors flex items-center justify-center'
                      }
                    >
                      <Icone
                        className={
                          m.emBreve
                            ? 'w-5 h-5 text-slate-400'
                            : 'w-5 h-5 text-teal-700'
                        }
                      />
                    </div>
                    {m.emBreve ? (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Em breve
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                  <CardTitle
                    className={
                      m.emBreve
                        ? 'text-base text-slate-500'
                        : 'text-base text-slate-900'
                    }
                  >
                    {m.titulo}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed pt-1">
                    {m.descricao}
                  </CardDescription>
                </CardHeader>
              </Card>
            );

            return m.emBreve ? (
              <div key={m.href} className="cursor-not-allowed">
                {conteudo}
              </div>
            ) : (
              <Link key={m.href} href={m.href}>
                {conteudo}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          Todas as operações são registradas em trilha de auditoria imutável
          (LGPD Art. 37).
        </p>
      </div>
    </div>
  );
}