// src/app/(app)/perfil/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/rbac';
import { buscarUsuarioPorId } from '@/lib/rbac/queries';
import { FormularioSenha } from './formulario-senha';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Mail,
  ShieldCheck,
  Building2,
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

export default async function PerfilPage() {
  const session = await getSession();

  if (!session) redirect('/login');

  const usuario = await buscarUsuarioPorId(session.userId);

  if (!usuario) redirect('/login');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Minha Conta
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Consulte seus dados de acesso e altere sua senha.
        </p>
      </div>

      {/* Dados do usuário */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base">Dados da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-base">
                {usuario.nomeCompleto
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-base font-medium text-slate-900">
                {usuario.nomeCompleto}
              </p>
              <Badge
                variant="outline"
                className="text-xs mt-1 text-teal-700 border-teal-200 bg-teal-50"
              >
                <ShieldCheck className="w-3 h-3 mr-1" />
                {LABEL_ROLE[usuario.role] ?? usuario.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  E-mail
                </p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {usuario.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Unidade vinculada
                </p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {usuario.unidadeNome ?? 'Acesso municipal'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Conta criada em
                </p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {formatarDataHora(usuario.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Último acesso
                </p>
                <p className="text-sm text-slate-900 mt-0.5">
                  {formatarDataHora(usuario.ultimoLogin)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
            Para alterar nome, e-mail ou perfil de acesso, procure o
            Administrador Municipal.
          </p>
        </CardContent>
      </Card>

      {/* Formulário de troca de senha */}
      <FormularioSenha />
    </div>
  );
}