// src/app/(app)/usuarios/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import {
  buscarUsuarioPorId,
  listarUnidadesParaSelect,
} from '@/lib/rbac/queries';
import { FormularioEdicaoUsuario } from './formulario-edicao';
import { AcoesUsuario } from './acoes-usuario';
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
  ShieldCheck,
  ShieldOff,
  Calendar,
  Clock,
} from 'lucide-react';

const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

function formatarDataHora(iso: string | null): string {
  if (!iso) return 'Nunca acessou';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function GerenciarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.verAuditoria(session.role)) redirect('/dashboard');

  const [usuario, unidades] = await Promise.all([
    buscarUsuarioPorId(id),
    listarUnidadesParaSelect(),
  ]);

  if (!usuario) notFound();

  const ehProprioUsuario = usuario.id === session.userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link
          href="/usuarios"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para usuários
        </Link>

        <div className="flex items-start justify-between gap-4 mt-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {usuario.nomeCompleto}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {LABEL_ROLE[usuario.role] ?? usuario.role}
                </Badge>
                {usuario.ativo ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-slate-500 border-slate-200"
                  >
                    <ShieldOff className="w-3 h-3 mr-1" />
                    Inativo
                  </Badge>
                )}
                {ehProprioUsuario && (
                  <Badge
                    variant="outline"
                    className="text-teal-700 border-teal-200 bg-teal-50"
                  >
                    Você
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de metadados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Criado em
              </p>
              <p className="text-sm text-slate-900 mt-0.5">
                {formatarDataHora(usuario.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Último acesso
              </p>
              <p className="text-sm text-slate-900 mt-0.5">
                {formatarDataHora(usuario.ultimoLogin)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de edição */}
      <FormularioEdicaoUsuario
        usuario={{
          id: usuario.id,
          email: usuario.email,
          nomeCompleto: usuario.nomeCompleto,
          role: usuario.role,
          unidadeId: usuario.unidadeId,
        }}
        unidades={unidades}
      />

      {/* Ações sensíveis */}
      <Card className="border-slate-200 mt-8">
        <CardHeader>
          <CardTitle className="text-base text-slate-700">
            Ações administrativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AcoesUsuario
            userId={usuario.id}
            userNome={usuario.nomeCompleto}
            ativo={usuario.ativo}
            ehProprioUsuario={ehProprioUsuario}
          />
          {ehProprioUsuario && (
            <p className="text-xs text-slate-500 mt-3 italic">
              Por segurança, você não pode desativar a sua própria conta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}