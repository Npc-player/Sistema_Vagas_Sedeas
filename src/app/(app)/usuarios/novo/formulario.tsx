// src/app/(app)/usuarios/novo/formulario.tsx
'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  rolesUsuario,
  LABEL_ROLE,
  ROLES_COM_UNIDADE,
} from '@/lib/validations/usuario';
import {
  criarUsuarioAction,
  type UsuarioActionState,
} from '../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Copy, KeyRound, Check } from 'lucide-react';

const initialState: UsuarioActionState = {};

interface UnidadeOption {
  id: string;
  nome: string;
  tipo: string;
}

interface FormularioUsuarioProps {
  unidades: UnidadeOption[];
}

export function FormularioUsuario({ unidades }: FormularioUsuarioProps) {
  const [state, formAction, isPending] = useActionState(
    criarUsuarioAction,
    initialState
  );

  const [role, setRole] = useState<string>('');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [senhaCopiada, setSenhaCopiada] = useState(false);

  const precisaUnidade = ROLES_COM_UNIDADE.includes(role);

  async function copiarSenha() {
    if (!state.senhaTemporaria) return;
    try {
      await navigator.clipboard.writeText(state.senhaTemporaria);
      setSenhaCopiada(true);
      setTimeout(() => setSenhaCopiada(false), 3000);
    } catch {
      // ignora
    }
  }

  // Se deu sucesso na criação, mostra a senha temporária
  if (state.success && state.senhaTemporaria) {
    return (
      <Card className="border-teal-200 max-w-2xl">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-teal-700" />
          </div>
          <CardTitle>Usuário criado com sucesso</CardTitle>
          <CardDescription>
            Anote ou copie a senha temporária agora. Ela <strong>não será
            exibida novamente</strong> por motivos de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              Senha temporária
            </p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-lg text-slate-900 flex-1 break-all">
                {state.senhaTemporaria}
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
            <strong>Importante:</strong> entregue a senha ao usuário por canal
            seguro. Ele deverá alterá-la no primeiro acesso.
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/usuarios">
              <Button variant="outline">Ver todos os usuários</Button>
            </Link>
            <Link href="/usuarios/novo">
              <Button>Criar outro</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium mb-1">Corrija os campos destacados:</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
          <CardDescription>
            A senha inicial é gerada pelo sistema e exibida apenas uma vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input id="nomeCompleto" name="nomeCompleto" />
            {state.fieldErrors?.nomeCompleto && (
              <p className="text-sm text-red-600 mt-1">
                {state.fieldErrors.nomeCompleto.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">E-mail institucional *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome.sobrenome@dominio.gov.br"
              autoComplete="off"
            />
            {state.fieldErrors?.email && (
              <p className="text-sm text-red-600 mt-1">
                {state.fieldErrors.email.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role-select">Perfil de acesso *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {rolesUsuario.map((r) => (
                  <SelectItem key={r} value={r}>
                    {LABEL_ROLE[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="role" value={role} />
            {state.fieldErrors?.role && (
              <p className="text-sm text-red-600 mt-1">
                {state.fieldErrors.role.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unidade-select">
              Unidade vinculada{precisaUnidade && ' *'}
            </Label>
            <Select
              value={unidadeId || '__none__'}
              onValueChange={(v) => setUnidadeId(v === '__none__' ? '' : v)}
            >
              <SelectTrigger id="unidade-select">
                <SelectValue placeholder="Nenhuma (acesso municipal)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  Nenhuma (acesso municipal)
                </SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="unidadeId" value={unidadeId} />
            <p className="text-xs text-slate-500 mt-1">
              {precisaUnidade
                ? 'Este perfil exige uma unidade vinculada.'
                : 'Opcional. Deixe em branco para perfis com acesso municipal (Administrador, Conselho, Judiciário, TI).'}
            </p>
            {state.fieldErrors?.unidadeId && (
              <p className="text-sm text-red-600 mt-1">
                {state.fieldErrors.unidadeId.join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/usuarios">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar usuário'}
        </Button>
      </div>
    </form>
  );
}