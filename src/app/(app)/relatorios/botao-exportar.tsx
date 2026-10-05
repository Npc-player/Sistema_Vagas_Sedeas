// src/app/(app)/relatorios/botao-exportar.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download } from 'lucide-react';

export function BotaoExportarPDF() {
  const searchParams = useSearchParams();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function exportar() {
    setErro(null);
    setEnviando(true);
    try {
      const body = {
        tipoRelatorio: searchParams.get('tipoRelatorio') ?? undefined,
        tipoPeriodo: searchParams.get('tipoPeriodo') ?? undefined,
        dataBase: searchParams.get('dataBase') ?? undefined,
        dataInicio: searchParams.get('dataInicio') ?? undefined,
        dataFim: searchParams.get('dataFim') ?? undefined,
        unidadeId: searchParams.get('unidadeId') ?? undefined,
      };

      const resp = await fetch('/api/relatorios/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        let msg = 'Erro ao gerar PDF.';
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch {
          // ignora
        }
        setErro(msg);
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = resp.headers.get('Content-Disposition');
      const match = cd?.match(/filename="(.+)"/);
      a.href = url;
      a.download = match?.[1] ?? 'relatorio.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setErro('Erro de rede ao exportar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={exportar} disabled={enviando}>
        <Download className="w-4 h-4 mr-1.5" />
        {enviando ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>
      {erro && (
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}