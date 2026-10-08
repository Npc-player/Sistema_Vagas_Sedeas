// src/app/(app)/acolhidos/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import {
  listarEmAcolhimento,
  listarSemAcolhimento,
  type FiltrosAcolhidos,
} from '@/lib/acolhidos/queries';
import { AbasAcolhidos } from './abas';
import { FiltrosAcolhidos as FiltrosUI } from './filtros';
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
import { UserPlus, Users, ChevronRight, Home, Search } from 'lucide-react';
import { LABEL_TIPO_SERVICO_CURTO } from '@/lib/constants/tipos';

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

interface PageProps {
  searchParams: Promise<{
    aba?: string;
    nome?: string;
    cpf?: string;
    medidaProtetiva?: string;
  }>;
}

export default async function AcolhidosPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  const params = await searchParams;
  const abaAtual =
    params.aba === 'sem-acolhimento' ? 'sem-acolhimento' : 'em-acolhimento';

  const filtros: FiltrosAcolhidos = {
    nome: params.nome,
    cpf: params.cpf,
    medidaProtetiva: params.medidaProtetiva,
  };

  // Carrega as duas listas sempre (para contadores das abas)
  const emAcolhimento = await listarEmAcolhimento(filtros);
  const semAcolhimento = await listarSemAcolhimento(filtros);

  const temFiltroAtivo = !!(
    params.nome ||
    params.cpf ||
    params.medidaProtetiva
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            Cadastro
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Pessoas Acolhidas
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Registro centralizado das pessoas em acolhimento institucional e
            das pessoas cadastradas sem vínculo ativo.
          </p>
        </div>
        <Link href="/acolhidos/novo">
          <Button>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Cadastrar pessoa
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <FiltrosUI />

      {/* Abas */}
      <AbasAcolhidos
        abaAtual={abaAtual}
        totalEmAcolhimento={emAcolhimento.length}
        totalSemAcolhimento={semAcolhimento.length}
      />

      {/* Conteúdo da aba */}
      {abaAtual === 'em-acolhimento' ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-5 h-5 text-teal-700" />
              Pessoas em acolhimento
              {temFiltroAtivo && (
                <span className="text-xs text-slate-500 font-normal">
                  (filtrado)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emAcolhimento.length === 0 ? (
              <div className="text-center py-12">
                {temFiltroAtivo ? (
                  <>
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Nenhum resultado encontrado com os filtros aplicados.
                    </p>
                  </>
                ) : (
                  <>
                    <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Nenhuma pessoa em acolhimento no momento.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Idade</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-center">Vaga</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emAcolhimento.map((p) => (
                    <TableRow key={p.acolhimentoId}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {p.nomeCompleto}
                        </div>
                        {p.nomeSocial && (
                          <div className="text-xs text-slate-500">
                            Nome social: {p.nomeSocial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {p.idade} anos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-900">
                          {p.unidadeNome}
                        </div>
                        <div className="text-xs text-slate-500">
                          {LABEL_TIPO_SERVICO_CURTO[p.unidadeTipo] ??
                            p.unidadeTipo}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {p.numeroVaga ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {p.protocolo}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(
                          p.dataAcolhimento + 'T00:00:00'
                        ).toLocaleDateString('pt-BR')}
                        <div className="text-xs text-slate-500">
                          {LABEL_REGIME[p.regime] ?? p.regime}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/acolhidos/${p.acolhidoId}`}>
                            <Button variant="ghost" size="sm">
                              Ficha
                            </Button>
                          </Link>
                          <Link href={`/acolhimentos/${p.acolhimentoId}`}>
                            <Button variant="outline" size="sm">
                              Acolhimento
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              Pessoas sem acolhimento ativo
              {temFiltroAtivo && (
                <span className="text-xs text-slate-500 font-normal">
                  (filtrado)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {semAcolhimento.length === 0 ? (
              <div className="text-center py-12">
                {temFiltroAtivo ? (
                  <>
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Nenhum resultado encontrado com os filtros aplicados.
                    </p>
                  </>
                ) : (
                  <>
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Todas as pessoas cadastradas estão em acolhimento.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Idade</TableHead>
                    <TableHead>Mãe</TableHead>
                    <TableHead>Grupo familiar</TableHead>
                    <TableHead className="text-center">
                      Acolh. anteriores
                    </TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semAcolhimento.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {p.nomeCompleto}
                        </div>
                        {p.nomeSocial && (
                          <div className="text-xs text-slate-500">
                            Nome social: {p.nomeSocial}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {p.idade} anos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {p.nomeMae ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.grupoFamiliar ? (
                          <Badge variant="outline" className="text-xs">
                            {p.grupoFamiliar}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.totalAcolhimentosAnteriores > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-700 border-amber-200 bg-amber-50"
                          >
                            {p.totalAcolhimentosAnteriores}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/acolhidos/${p.id}`}>
                          <Button variant="outline" size="sm">
                            Detalhes
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
      )}
    </div>
  );
}