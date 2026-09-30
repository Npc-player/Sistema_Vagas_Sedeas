// src/app/(app)/auditoria/botao-exportar.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ShieldAlert, FileText } from 'lucide-react';

const MIN_CARACTERES = 30;

export function BotaoExportar() {
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const caracteres = justificativa.trim().length;
  const valido = caracteres >= MIN_CARACTERES;

  async function exportar() {
    setErro(null);
    if (!valido) {
      setErro(
        `A justificativa deve ter pelo menos ${MIN_CARACTERES} caracteres.`
      );
      return;
    }

    setEnviando(true);
    try {
      const body = {
        justificativa: justificativa.trim(),
        action: searchParams.get('action') || undefined,
        entity: searchParams.get('entity') || undefined,
        userId: searchParams.get('userId') || undefined,
        dataInicio: searchParams.get('dataInicio') || undefined,
        dataFim: searchParams.get('dataFim') || undefined,
      };

      const resp = await fetch('/api/auditoria/exportar', {
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
        setEnviando(false);
        return;
      }

      // Faz o download do blob
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const contentDisposition = resp.headers.get('Content-Disposition');
      const match = contentDisposition?.match(/filename="(.+)"/);
      a.href = url;
      a.download = match?.[1] ?? 'trilha-auditoria.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Fecha e limpa
      setAberto(false);
      setJustificativa('');
    } catch (e) {
      console.error(e);
      setErro('Erro de rede ao exportar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setAberto(v);
    if (!v) {
      setJustificativa('');
      setErro(null);
    }
  }

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <Download className="w-4 h-4 mr-1.5" />
        Exportar PDF
      </Button>

      <Dialog open={aberto} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-700" />
              Exportar trilha de auditoria
            </DialogTitle>
            <DialogDescription>
              A exportação gera um documento PDF com os registros que atendem
              aos filtros atuais. Por exigência legal (LGPD Art. 37), é
              obrigatório informar a justificativa.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-amber-900 text-xs leading-relaxed">
              A justificativa informada e a identificação do solicitante serão
              gravadas de forma imutável na trilha de auditoria, junto com o
              protocolo único de exportação.
            </p>
          </div>

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="justificativa">Justificativa legal *</Label>
            <Textarea
              id="justificativa"
              rows={5}
              placeholder="Ex.: Requisição do Ministério Público — Ofício nº 123/2026, para subsidiar inquérito civil sobre ocupação da rede."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              disabled={enviando}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-slate-500">
                Mínimo {MIN_CARACTERES} caracteres · máximo 2000
              </p>
              <p
                className={`text-xs ${
                  valido ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {caracteres} / 2000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button onClick={exportar} disabled={enviando || !valido}>
              <Download className="w-4 h-4 mr-1.5" />
              {enviando ? 'Gerando PDF...' : 'Confirmar exportação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}