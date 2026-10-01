// src/app/(app)/vagas/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, can } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BedDouble,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Building2,
} from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  JOSE_CALHERANI: 'José Calherani',
  RESIDENCIA_INCLUSIVA: 'R.I.',
};

interface VagaRow {
  unidade_id: string;
  status: string;
}

interface UnidadeResumo {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  ativo: boolean;
  total: number;
  disponiveis: number;
  ocupadas: number;
  bloqueadas: number;
  reservadas: number;
  taxa: number;
}

export default async function VagasPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.editarVagas(session.role) && session.role !== 'CONSELHO_MUNICIPAL' && session.role !== 'JUDICIARIO_MP') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Busca unidades + vagas em duas queries (mais simples que um join manual)
  const { data: unidades } = await supabase
    .from('unidades')
    .select('id, nome, tipo, cidade, uf, ativo')
    .order('nome');

  const { data: vagas } = await supabase
    .from('vagas')
    .select('unidade_id, status');

  const vagasList: VagaRow[] = vagas ?? [];

  // Agrupa por unidade
  const porUnidade = new Map<string, UnidadeResumo>();
  for (const u of unidades ?? []) {
    porUnidade.set(u.id, {
      id: u.id,
      nome: u.nome,
      tipo: u.tipo,
      cidade: u.cidade,
      uf: u.uf,
      ativo: u.ativo,
      total: 0,
      disponiveis: 0,
      ocupadas: 0,
      bloqueadas: 0,
      reservadas: 0,
      taxa: 0,
    });
  }

  for (const v of vagasList) {
    const u = porUnidade.get(v.unidade_id);
    if (!u) continue;
    u.total++;
    if (v.status === 'DISPONIVEL') u.disponiveis++;
    else if (v.status === 'OCUPADA') u.ocupadas++;
    else if (v.status === 'BLOQUEADA') u.bloqueadas++;
    else if (v.status === 'RESERVADA') u.reservadas++;
  }

  const lista = Array.from(porUnidade.values()).map((u) => ({
    ...u,
    taxa: u.total > 0 ? Math.round((u.ocupadas / u.total) * 100) : 0,
  }));

  // Totais gerais
  const totais = lista.reduce(
    (acc, u) => ({
      total: acc.total + u.total,
      disponiveis: acc.disponiveis + u.disponiveis,
      ocupadas: acc.ocupadas + u.ocupadas,
      bloqueadas: acc.bloqueadas + u.bloqueadas,
      reservadas: acc.reservadas + u.reservadas,
    }),
    { total: 0, disponiveis: 0, ocupadas: 0, bloqueadas: 0, reservadas: 0 }
  );

  const taxaGeral =
    totais.total > 0 ? Math.round((totais.ocupadas / totais.total) * 100) : 0;

  // Agrupa por tipo
  const porTipo = new Map<string, { total: number; ocupadas: number; disponiveis: number }>();
  for (const u of lista) {
    const atual = porTipo.get(u.tipo) ?? { total: 0, ocupadas: 0, disponiveis: 0 };
    atual.total += u.total;
    atual.ocupadas += u.ocupadas;
    atual.disponiveis += u.disponiveis;
    porTipo.set(u.tipo, atual);
  }

  const ativas = lista.filter((u) => u.ativo);
  const inativas = lista.filter((u) => !u.ativo);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Operação
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Controle de Vagas
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Visão consolidada da ocupação da rede socioassistencial do município.
        </p>
      </div>

      {/* Cards de resumo geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Capacidade total
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totais.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Disponíveis
                </p>
                <p className="text-2xl font-semibold text-emerald-700">
                  {totais.disponiveis}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Ocupadas
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totais.ocupadas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Taxa de ocupação
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {taxaGeral}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards por tipo */}
      {porTipo.size > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Por tipo de serviço
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(porTipo.entries()).map(([tipo, dados]) => {
              const taxa =
                dados.total > 0
                  ? Math.round((dados.ocupadas / dados.total) * 100)
                  : 0;
              return (
                <Card key={tipo} className="border-slate-200">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {LABEL_TIPO[tipo] ?? tipo}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {taxa}% ocupado
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-slate-900">
                        {dados.disponiveis}
                      </span>
                      <span className="text-xs text-slate-500">
                        de {dados.total} disponíveis
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{ width: `${taxa}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela por unidade */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Por unidade
        </h2>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {ativas.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Nenhuma unidade ativa cadastrada.
                </p>
                {can.criarUnidade(session.role) && (
                  <Link href="/unidades/nova">
                    <Button className="mt-4">Cadastrar unidade</Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Capacidade</TableHead>
                    <TableHead className="text-center">Disponíveis</TableHead>
                    <TableHead className="text-center">Ocupadas</TableHead>
                    <TableHead className="text-center">Bloqueadas</TableHead>
                    <TableHead className="w-35">Ocupação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ativas.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {u.nome}
                        </div>
                        <div className="text-xs text-slate-500">
                          {u.cidade}/{u.uf}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {LABEL_TIPO[u.tipo] ?? u.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {u.total}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-emerald-700">
                          {u.disponiveis}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-rose-700">
                          {u.ocupadas}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-amber-700">
                          {u.bloqueadas}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                u.taxa >= 95
                                  ? 'bg-rose-600'
                                  : u.taxa >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-teal-600'
                              }`}
                              style={{ width: `${u.taxa}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 w-9 text-right">
                            {u.taxa}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/vagas/${u.id}`}>
                          <Button variant="outline" size="sm">
                            Ver vagas
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
      </div>

      {/* Unidades inativas */}
      {inativas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Unidades inativas
          </h2>
          <Card className="border-slate-200 border-dashed">
            <CardContent className="pt-5">
              <ul className="space-y-2">
                {inativas.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{u.nome}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Inativa
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400">
                      {u.total} vagas
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}