// src/app/(app)/relatorios/preview-central.tsx
import {
  calcularTotais,
  type LinhaCentralRegulacao,
} from '@/lib/relatorios/queries';
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
import { Building2 } from 'lucide-react';

const LABEL_TIPO: Record<string, string> = {
  ILPI: 'ILPI',
  SAICA: 'SAICA',
  CENTRO_DIA_IDOSO: 'Centro Dia',
  SAI: 'SAI — Serviço de Acolhimento Institucional',
  RESIDENCIA_INCLUSIVA: 'R.I.',
  CASA_PASSAGEM: 'Casa de Passagem',
};

interface PreviewCentralProps {
  linhas: LinhaCentralRegulacao[];
  titulo: string;
}

export function PreviewCentral({ linhas, titulo }: PreviewCentralProps) {
  const totais = calcularTotais(linhas);

  if (linhas.length === 0) {
    return (
      <Card className="border-slate-200 border-dashed">
        <CardContent className="py-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Nenhuma unidade encontrada para o filtro aplicado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-center">Meta</TableHead>
                <TableHead className="text-center">Entradas</TableHead>
                <TableHead className="text-center">Saídas</TableHead>
                <TableHead className="text-center">Evasões/Outros</TableHead>
                <TableHead className="text-center">Acolhidos</TableHead>
                <TableHead className="text-center">Permanecentes</TableHead>
                <TableHead className="text-center">Vagas Disp.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.unidadeId}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {l.unidadeNome}
                    </div>
                    <div className="text-xs text-slate-500">
                      {LABEL_TIPO[l.unidadeTipo] ?? l.unidadeTipo}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {l.metaConveniada}
                  </TableCell>
                  <TableCell className="text-center text-sm text-teal-700 font-medium">
                    {l.entradas}
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-700">
                    {l.saidas}
                  </TableCell>
                  <TableCell className="text-center text-sm text-amber-700">
                    {l.evasoesOutros}
                  </TableCell>
                  <TableCell className="text-center text-sm text-rose-700 font-medium">
                    {l.acolhidos}
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-700">
                    {l.permanecentes}
                  </TableCell>
                  <TableCell className="text-center text-sm text-emerald-700 font-medium">
                    {l.vagasDisponiveis}
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha de totais */}
              <TableRow className="bg-slate-50 font-semibold">
                <TableCell className="text-slate-900">Total</TableCell>
                <TableCell className="text-center text-slate-900">
                  {totais.metaConveniada}
                </TableCell>
                <TableCell className="text-center text-teal-800">
                  {totais.entradas}
                </TableCell>
                <TableCell className="text-center text-slate-800">
                  {totais.saidas}
                </TableCell>
                <TableCell className="text-center text-amber-800">
                  {totais.evasoesOutros}
                </TableCell>
                <TableCell className="text-center text-rose-800">
                  {totais.acolhidos}
                </TableCell>
                <TableCell className="text-center text-slate-800">
                  {totais.permanecentes}
                </TableCell>
                <TableCell className="text-center text-emerald-800">
                  {totais.vagasDisponiveis}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-xs text-slate-500 space-y-1">
          <p>
            <strong>Meta:</strong> capacidade conveniada da unidade.
          </p>
          <p>
            <strong>Acolhidos:</strong> pessoas em acolhimento ao fim do
            período (inclui permanecentes e entradas).
          </p>
          <p>
            <strong>Permanecentes:</strong> acolhidos que já estavam na unidade
            antes do início do período.
          </p>
          <p>
            <strong>Vagas disponíveis:</strong> meta − acolhidos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}