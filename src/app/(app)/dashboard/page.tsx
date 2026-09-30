// src/app/(app)/dashboard/page.tsx
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
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
} from 'lucide-react';

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

  if (!session) {
    return null;
  }

  const modulos = [
    {
      titulo: 'Unidades de Acolhimento',
      descricao: 'Cadastro e gestão das unidades da rede socioassistencial.',
      href: '/unidades',
      icone: Building2,
      visivel: can.listarUnidades(session.role),
    },
        {
      titulo: 'Controle de Vagas',
      descricao: 'Monitoramento em tempo real da ocupação e disponibilidade.',
      href: '/vagas',
      icone: BedDouble,
      visivel:
        can.editarVagas(session.role) ||
        session.role === 'CONSELHO_MUNICIPAL' ||
        session.role === 'JUDICIARIO_MP',
    },
    {
      titulo: 'Pessoas Acolhidas',
      descricao: 'Cadastro e acompanhamento das pessoas em acolhimento.',
      href: '/acolhidos',
      icone: Users,
      visivel: can.cadastrarAcolhido(session.role),
      emBreve: true,
    },
    {
      titulo: 'Auditoria',
      descricao: 'Trilha imutável de todas as operações do sistema.',
      href: '/auditoria',
      icone: ShieldCheck,
      visivel: can.verAuditoria(session.role),
      emBreve: true,
    },
  ].filter((m) => m.visivel);

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
          Gerencie a rede de acolhimentos e monitore as vagas do município.
        </p>
      </div>

      {/* Card de conta */}
      <Card className="mb-8 border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
                <span className="text-teal-700 font-semibold text-base">
                  {session.userEmail.split('@')[0].slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {session.userEmail}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {LABEL_ROLE[session.role] ?? session.role}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
              Conta ativa
            </Badge>
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

      {/* Rodapé informativo */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          Todas as operações são registradas em trilha de auditoria imutável (LGPD Art. 37).
        </p>
      </div>
    </div>
  );
}