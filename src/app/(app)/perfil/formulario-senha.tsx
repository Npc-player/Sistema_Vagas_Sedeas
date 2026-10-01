// src/app/(app)/perfil/formulario-senha.tsx
'use client';

import { useActionState, useState } from 'react';
import { trocarSenhaAction, type PerfilActionState } from './actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, Check, X } from 'lucide-react';

const initialState: PerfilActionState = {};

// Regras de senha forte — feedback visual ao usuário
const REGRAS = [
  { key: 'length', label: 'Mínimo 12 caracteres', test: (s: string) => s.length >= 12 },
  { key: 'upper', label: 'Letra maiúscula', test: (s: string) => /[A-Z]/.test(s) },
  { key: 'lower', label: 'Letra minúscula', test: (s: string) => /[a-z]/.test(s) },
  { key: 'digit', label: 'Número', test: (s: string) => /\d/.test(s) },
  {
    key: 'special',
    label: 'Caractere especial (!@#$%...)',
    test: (s: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s),
  },
];

export function FormularioSenha() {
  const [state, formAction, isPending] = useActionState(
    trocarSenhaAction,
    initialState
  );

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const regrasOk = REGRAS.filter((r) => r.test(novaSenha)).length;
  const todasRegrasOk = regrasOk === REGRAS.length;
  const senhasCoincidem =
    novaSenha.length > 0 && novaSenha === confirmarSenha;
  const senhaDiferente = senhaAtual.length > 0 && senhaAtual !== novaSenha;

  const podeEnviar =
    senhaAtual.length > 0 &&
    todasRegrasOk &&
    senhasCoincidem &&
    senhaDiferente;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Senha alterada com sucesso. Da próxima vez, use a nova senha.
          </AlertDescription>
        </Alert>
      )}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              {Object.entries(state.fieldErrors).map(([campo, msgs]) => (
                <li key={campo}>
                  <strong>{campo}</strong>: {msgs.join(', ')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4 text-teal-700" />
            Alterar senha
          </CardTitle>
          <CardDescription>
            A nova senha deve atender a todos os requisitos de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Senha atual */}
          <div>
            <Label htmlFor="senhaAtual">Senha atual *</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                name="senhaAtual"
                type={mostrarAtual ? 'text' : 'password'}
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarAtual((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                aria-label={mostrarAtual ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarAtual ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <Label htmlFor="novaSenha">Nova senha *</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                name="novaSenha"
                type={mostrarNova ? 'text' : 'password'}
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarNova((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                aria-label={mostrarNova ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarNova ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Requisitos */}
            {novaSenha.length > 0 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {REGRAS.map((r) => {
                  const ok = r.test(novaSenha);
                  return (
                    <div
                      key={r.key}
                      className={`flex items-center gap-1.5 text-xs ${
                        ok ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {ok ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {r.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirmar senha */}
          <div>
            <Label htmlFor="confirmarSenha">Confirmar nova senha *</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type={mostrarConfirmar ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarConfirmar ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmarSenha.length > 0 && !senhasCoincidem && (
              <p className="text-xs text-rose-600 mt-1">
                As senhas não coincidem.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !podeEnviar}>
          {isPending ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </div>
    </form>
  );
}