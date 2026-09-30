// src/app/(app)/usuarios/[id]/acoes-usuario.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  alternarStatusUsuarioAction,
  resetarSenhaUsuarioAction,
} from '../actions';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KeyRound, Power, PowerOff, Copy, Check } from 'lucide-react';

interface AcoesUsuarioProps {
  userId: string;
  userNome: string;
  ativo: boolean;
  ehProprioUsuario: boolean;
}

export function AcoesUsuario({
  userId,
  userNome,
  ativo,
  ehProprioUsuario,
}: AcoesUsuarioProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal desativar/reativar
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [erroStatus, setErroStatus] = useState<string | null>(null);

  // Modal resetar senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [novaSenha, setNovaSenha] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [senhaCopiada, setSenhaCopiada] = useState(false);

  function confirmarStatus() {
    setErroStatus(null);
    startTransition(async () => {
      const r = await alternarStatusUsuarioAction(userId, !ativo);
      if (r.error) {
        setErroStatus(r.error);
        return;
      }
      setModalStatusAberto(false);
      router.refresh();
    });
  }

  function confirmarResetSenha() {
    setErroSenha(null);
    setNovaSenha(null);
    startTransition(async () => {
      const r = await resetarSenhaUsuarioAction(userId);
      if (r.error) {
        setErroSenha(r.error);
        return;
      }
      setNovaSenha(r.senhaTemporaria ?? null);
    });
  }

  async function copiarSenha() {
    if (!novaSenha) return;
    try {
      await navigator.clipboard.writeText(novaSenha);
      setSenhaCopiada(true);
      setTimeout(() => setSenhaCopiada(false), 3000);
    } catch {
      // ignora
    }
  }

  function fecharModalSenha(v: boolean) {
    setModalSenhaAberto(v);
    if (!v) {
      setNovaSenha(null);
      setErroSenha(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setModalSenhaAberto(true)}
        >
          <KeyRound className="w-4 h-4 mr-1.5" />
          Resetar senha
        </Button>

        {!ehProprioUsuario && (
          <Button
            variant="outline"
            onClick={() => setModalStatusAberto(true)}
            className={
              ativo
                ? 'text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800'
                : ''
            }
          >
            {ativo ? (
              <>
                <PowerOff className="w-4 h-4 mr-1.5" />
                Desativar
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-1.5" />
                Reativar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Modal desativar/reativar */}
      <Dialog open={modalStatusAberto} onOpenChange={setModalStatusAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ativo ? 'Desativar usuário' : 'Reativar usuário'}
            </DialogTitle>
            <DialogDescription>
              {ativo ? (
                <>
                  Tem certeza que deseja desativar <strong>{userNome}</strong>?
                  <br />
                  <br />
                  O usuário perderá acesso imediatamente e não conseguirá
                  fazer login até ser reativado.
                </>
              ) : (
                <>
                  Deseja reativar o acesso de <strong>{userNome}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {erroStatus && (
            <Alert variant="destructive">
              <AlertDescription>{erroStatus}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalStatusAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarStatus}
              disabled={isPending}
              className={
                ativo ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
              }
            >
              {isPending
                ? 'Processando...'
                : ativo
                  ? 'Sim, desativar'
                  : 'Sim, reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal resetar senha */}
      <Dialog open={modalSenhaAberto} onOpenChange={fecharModalSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>
              Uma nova senha temporária será gerada para{' '}
              <strong>{userNome}</strong>. A senha antiga deixa de funcionar
              imediatamente.
            </DialogDescription>
          </DialogHeader>

          {erroSenha && (
            <Alert variant="destructive">
              <AlertDescription>{erroSenha}</AlertDescription>
            </Alert>
          )}

          {novaSenha ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Nova senha temporária
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-base text-slate-900 flex-1 break-all">
                    {novaSenha}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copiarSenha}
                  >
                    {senhaCopiada ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">
                <strong>Importante:</strong> esta senha não será exibida
                novamente. Entregue ao usuário por canal seguro.
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {novaSenha ? (
              <Button onClick={() => fecharModalSenha(false)}>Concluir</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => fecharModalSenha(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button onClick={confirmarResetSenha} disabled={isPending}>
                  <KeyRound className="w-4 h-4 mr-1.5" />
                  {isPending ? 'Gerando...' : 'Gerar nova senha'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}