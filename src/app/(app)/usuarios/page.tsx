// src/app/(app)/usuarios/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { listarUsuarios } from '@/lib/rbac/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Users, ShieldCheck, ShieldOff } from 'lucide-react';

const LABEL_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  GESTOR_ACOLHIMENTO: 'Gestor de Acolhimento',
  OPERADOR: 'Operador / Recepção',
  CONSELHO_MUNICIPAL: 'Conselho Municipal',
  JUDICIARIO_MP: 'Judiciário / MP',
  TI_SUPORTE: 'TI / Suporte',
};

const COR_ROLE: Record<string, string> = {
  ADMIN_MUNICIPAL: 'bg-teal-50 text-teal-800 border-teal-200',
  GESTOR_ACOLHIMENTO: 'bg-blue-50 text-blue-800 border-blue-200',
  OPERADOR: 'bg-slate-50 text-slate-700 border-slate-200',
  CONSELHO_MUNICIPAL: 'bg-purple-50 text-purple-800 border-purple-200',
  JUDICIARIO_MP: 'bg-amber-50 text-amber-800 border-amber-200',
  TI_SUPORTE: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default async function UsuariosPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.verAuditoria(session.role)) redirect('/dashboard');

  const usuarios = await listarUsuarios();
  const ativos = usuarios.filter((u) => u.ativo);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            Governança
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-700" />
            Usuários do Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Gestão de credenciais, perfis de acesso e vínculos institucionais.
          </p>
        </div>
        <Link href="/usuarios/novo">
          <Button>
            <Plus className="w-4 h-4 mr-1.5" />
            Novo usuário
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">
            {usuarios.length}{' '}
            {usuarios.length === 1 ? 'usuário' : 'usuários'}{' '}
            <span className="text-slate-400 font-normal">
              · {ativos.length} ativos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-slate-900">
                    {u.nomeCompleto}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${COR_ROLE[u.role] ?? ''}`}
                    >
                      {LABEL_ROLE[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {u.unidadeNome ?? '—'}
                  </TableCell>
                  <TableCell>
                    {u.ativo ? (
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/usuarios/${u.id}`}>
                      <Button variant="outline" size="sm">
                        Gerenciar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}