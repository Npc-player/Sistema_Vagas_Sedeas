// src/app/(app)/dpo/botao-responder.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  statusRequisicaoLgpd,
  LABEL_STATUS_REQUISICAO,
} from '@/lib/validations/dpo';
import { responderRequisicaoAction } from './actions';
import type { RequisicaoLgpd } from '@/lib/dpo/queries';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquareReply } from 'lucide-react';

interface BotaoResponderProps {
  requisicao: RequisicaoLgpd;
  variant?: 'default' | 'outline' | 'ghost';
  label?: string;
}

export function BotaoResponder({
  requisicao,
  variant = 'outline',
  label = 'Responder',
}: BotaoResponderProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  const [novoStatus, setNovoStatus] = useState<string>(
    requisicao.status === 'RECEBIDA' ? 'EM_ANALISE' : 'RESPONDIDA'
  );
  const [resposta, setResposta] = useState<string>(
    requisicao.resposta ?? ''
  );

  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(v: boolean) {
    setAberto(v);
    if (!v) {
      // Reset ao fechar
      setErro(null);
      setFieldErrors({});
      setResposta(requisicao.resposta ?? '');
      setNovoStatus(
        requisicao.status === 'RECEBIDA' ? 'EM_ANALISE' : 'RESPONDIDA'
      );
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('requisicaoId', requisicao.id);
    formData.set('resposta', resposta);
    formData.set('novoStatus', novoStatus);

    startTransition(async () => {
      const result = await responderRequisicaoAction({}, formData);

      if (result.error) {
        setErro(result.error);
        return;
      }

      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setFieldErrors(result.fieldErrors);
        return;
      }

      // Sucesso
      setAberto(false);
      setResposta('');
      setErro(null);
      setFieldErrors({});
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setAberto(true)}>
        <MessageSquareReply className="w-3.5 h-3.5 mr-1.5" />
        {label}
      </Button>

      <Dialog open={aberto} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responder requisição</DialogTitle>
            <DialogDescription>
              Protocolo{' '}
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                {requisicao.protocolo}
              </code>{' '}
              · {requisicao.requerenteNome}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Descrição do requerente
            </p>
            <p className="text-slate-700 whitespace-pre-wrap text-sm">
              {requisicao.descricao}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert variant="destructive">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {Object.keys(fieldErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {Object.entries(fieldErrors).map(([campo, msgs]) => (
                      <li key={campo}>
                        <strong>{campo}</strong>: {msgs.join(', ')}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="novoStatus">Novo status *</Label>
              <Select value={novoStatus} onValueChange={setNovoStatus}>
                <SelectTrigger id="novoStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusRequisicaoLgpd
                    .filter((s) => s !== 'RECEBIDA')
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {LABEL_STATUS_REQUISICAO[s]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resposta">Resposta ao requerente *</Label>
              <Textarea
                id="resposta"
                rows={6}
                placeholder="Descreva a resposta oficial ao titular dos dados. Esta resposta será registrada em auditoria."
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-slate-500 mt-1">
                Mínimo 20 caracteres · máximo 4000
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar resposta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}