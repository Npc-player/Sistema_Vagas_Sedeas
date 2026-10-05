// src/app/(app)/modulos/page.tsx
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building2,
  BedDouble,
  Users,
  ShieldCheck,
  ClipboardList,
  UserCog,
  Scale,
  Lock,
  Info,
  FileBarChart2,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

interface Modulo {
  titulo: string;
  descricao: string;
  href: string;
  icone: LucideIcon;
  visivel: boolean;
  emBreve?: boolean;
}

export default async function ModulosPage() {
  const session = await getSession();

  if (!session) return null;

  const modulos: Modulo[] = [
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
    },
    {
      titulo: 'Acolhimentos',
      descricao: 'Admissões, desligamentos e histórico institucional.',
      href: '/acolhimentos',
      icone: ClipboardList,
      visivel: can.cadastrarAcolhido(session.role),
    },
    {
      titulo: 'Consulta Judiciária',
      descricao:
        'Consulta a registros individuais vinculados a procedimentos legais.',
      href: '/judiciario',
      icone: Scale,
      visivel:
        session.role === 'JUDICIARIO_MP' ||
        session.role === 'ADMIN_MUNICIPAL',
    },
    {
      titulo: 'DPO — LGPD',
      descricao:
        'Encarregado pelo Tratamento de Dados e canal de requisições LGPD.',
      href: '/dpo',
      icone: Lock,
      visivel: can.verAuditoria(session.role),
    },
    {
      titulo: 'Usuários do Sistema',
      descricao: 'Gestão de credenciais, perfis de acesso e vínculos.',
      href: '/usuarios',
      icone: UserCog,
      visivel: can.verAuditoria(session.role),
    },

        {
      titulo: 'Relatórios',
      descricao:
        'Central de Regulação e Fluxo Mensal Detalhado de acolhimentos.',
      href: '/relatorios',
      icone: FileBarChart2,
      visivel: can.cadastrarAcolhido(session.role),
    },

    {
      titulo: 'Auditoria',
      descricao: 'Trilha imutável de todas as operações do sistema.',
      href: '/auditoria',
      icone: ShieldCheck,
      visivel: can.verAuditoria(session.role),
    },
    {
      titulo: 'Sobre o Sistema',
      descricao: 'Versão, notas de atualização e créditos institucionais.',
      href: '/sobre',
      icone: Info,
      visivel: true,
    },
  ].filter((m) => m.visivel);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Navegação
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Módulos do Sistema
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Acesse as áreas disponíveis para o seu perfil ·{' '}
          {LABEL_ROLE[session.role] ?? session.role}
        </p>
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={
                      m.emBreve
                        ? 'w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center'
                        : 'w-12 h-12 rounded-lg bg-teal-50 group-hover:bg-teal-100 transition-colors flex items-center justify-center'
                    }
                  >
                    <Icone
                      className={
                        m.emBreve
                          ? 'w-6 h-6 text-slate-400'
                          : 'w-6 h-6 text-teal-700'
                      }
                    />
                  </div>
                  {m.emBreve ? (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
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
                <CardDescription className="text-sm leading-relaxed pt-1">
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
  );
}