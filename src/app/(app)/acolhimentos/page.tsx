// src/app/(app)/acolhimentos/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getSession, can } from '@/lib/rbac';
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
import { BedDouble, Plus, ChevronRight } from 'lucide-react';

const LABEL_REGIME: Record<string, string> = {
  PROVISORIO: 'Provisório',
  DEFINITIVO: 'Definitivo',
};

const LABEL_MOTIVO: Record<string, string> = {
  VULNERABILIDADE_SOCIAL: 'Vulnerabilidade social',
  NEGLIGENCIA_FAMILIAR: 'Negligência familiar',
  VIOLENCIA_DOMESTICA: 'Violência doméstica',
  ABANDONO: 'Abandono',
  DEPENDENCIA_QUIMICA: 'Dependência química',
  SAUDE_MENTAL: 'Saúde mental',
  SITUACAO_RUA: 'Situação de rua',
  DETERMINACAO_JUDICIAL: 'Determinação judicial',
  OUTRO: 'Outro',
};

interface AcolhimentoRow {
  id: string;
  protocolo: string;
  acolhido_id: string;
  acolhido_nome: string;
  unidade_id: string;
  unidade_nome: string;
  unidade_tipo: string;
  data_acolhimento: string;
  motivo_acolhimento: string;
  regime: string;
  ativo: boolean;
}

export default async function AcolhimentosPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (!can.cadastrarAcolhido(session.role)) redirect('/dashboard');

  const rows = await db.execute(sql`
    SELECT
      ac.id,
      ac.protocolo,
      ac.acolhido_id,
      a.nome_completo AS acolhido_nome,
      ac.unidade_id,
      u.nome AS unidade_nome,
      u.tipo AS unidade_tipo,
      ac.data_acolhimento,
      ac.motivo_acolhimento,
      ac.regime,
      ac.ativo
    FROM acolhimentos ac
    JOIN acolhidos a ON a.id = ac.acolhido_id
    JOIN unidades u ON u.id = ac.unidade_id
    ORDER BY ac.ativo DESC, ac.data_acolhimento DESC
  `);

  const acolhimentos = rows as unknown as AcolhimentoRow[];

  const ativos = acolhimentos.filter((a) => a.ativo);
  const encerrados = acolhimentos.filter((a) => !a.ativo);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            Operação
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Acolhimentos
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Registro das admissões e desligamentos na rede socioassistencial.
          </p>
        </div>
        <Link href="/acolhimentos/novo">
          <Button>
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar admissão
          </Button>
        </Link>
      </div>

      {/* Ativos */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BedDouble className="w-5 h-5" />
            {ativos.length}{' '}
            {ativos.length === 1
              ? 'acolhimento ativo'
              : 'acolhimentos ativos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ativos.length === 0 ? (
            <div className="text-center py-12">
              <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Nenhum acolhimento ativo no momento.
              </p>
              <Link href="/acolhimentos/novo">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Registrar primeira admissão
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Unidade / Leito</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ativos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {a.protocolo}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {a.acolhido_nome}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">
                        {a.unidade_nome}
                      </div>
                      <div className="text-xs text-slate-500">
                        {LABEL_MOTIVO[a.motivo_acolhimento] ?? a.motivo_acolhimento}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(
                        a.data_acolhimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {LABEL_REGIME[a.regime] ?? a.regime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/acolhimentos/${a.id}`}>
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

      {/* Encerrados */}
      {encerrados.length > 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-slate-600">
              Histórico ({encerrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encerrados.map((a) => (
                  <TableRow key={a.id} className="opacity-75">
                    <TableCell className="font-mono text-xs text-slate-500">
                      {a.protocolo}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {a.acolhido_nome}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {a.unidade_nome}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(
                        a.data_acolhimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/acolhimentos/${a.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}