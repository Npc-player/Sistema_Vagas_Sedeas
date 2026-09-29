// src/app/(app)/unidades/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Building2 } from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'R.I.',
};

export default async function UnidadesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!can.listarUnidades(session.role)) {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: unidades, error } = await supabase
    .from('unidades')
    .select(
      'id, nome, tipo, cidade, uf, capacidade_total, ativo, responsavel_nome'
    )
    .order('nome', { ascending: true });

  if (error) {
    console.error('[UnidadesPage] erro ao listar:', error);
  }

  const lista = unidades ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho da página (não o do layout) */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Rede de Acolhimentos
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Unidades cadastradas no município
          </p>
        </div>
        {can.criarUnidade(session.role) && (
          <Link href="/unidades/nova">
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              Nova unidade
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5" />
            {lista.length}{' '}
            {lista.length === 1
              ? 'unidade cadastrada'
              : 'unidades cadastradas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                Nenhuma unidade cadastrada ainda.
              </p>
              {can.criarUnidade(session.role) && (
                <Link href="/unidades/nova">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Cadastrar primeira unidade
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {LABEL_TIPO[u.tipo] ?? u.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {u.cidade}/{u.uf}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.capacidade_total} vagas
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {u.responsavel_nome}
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/unidades/${u.id}`}>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}