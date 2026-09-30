// src/app/(app)/acolhidos/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { listarAcolhidosBasico } from '@/lib/crypto/acolhido';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Users, ChevronRight } from 'lucide-react';

export default async function AcolhidosPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  const acolhidos = await listarAcolhidosBasico();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            Cadastro
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Pessoas Acolhidas
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Registro centralizado das pessoas em acolhimento institucional.
          </p>
        </div>
        <Link href="/acolhidos/novo">
          <Button>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Cadastrar pessoa
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5" />
            {acolhidos.length}{' '}
            {acolhidos.length === 1
              ? 'pessoa cadastrada'
              : 'pessoas cadastradas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acolhidos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Nenhuma pessoa cadastrada ainda.
              </p>
              <Link href="/acolhidos/novo">
                <Button className="mt-4">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Cadastrar primeira pessoa
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de nascimento</TableHead>
                  <TableHead className="text-center">Idade</TableHead>
                  <TableHead>Mãe</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acolhidos.map((a) => {
                  const idade = calcularIdade(a.dataNascimento);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {a.nomeCompleto}
                        </div>
                        {a.nomeSocial && (
                          <div className="text-xs text-slate-500">
                            Nome social: {a.nomeSocial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(
                          a.dataNascimento + 'T00:00:00'
                        ).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {idade} anos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {a.nomeMae ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/acolhidos/${a.id}`}>
                          <Button variant="outline" size="sm">
                            Detalhes
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}