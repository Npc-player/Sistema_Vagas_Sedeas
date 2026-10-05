// src/app/(app)/usuarios/[id]/formulario-edicao.tsx
'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  rolesUsuario,
  LABEL_ROLE,
  ROLES_COM_UNIDADE,
} from '@/lib/validations/usuario';
import { editarUsuarioAction, type UsuarioActionState } from '../actions';

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
import { Check } from 'lucide-react';
import { useEffect } from 'react';

const initialState: UsuarioActionState = {};

interface UnidadeOption {
  id: string;
  nome: string;
  tipo: string;
}

interface FormularioEdicaoProps {
  usuario: {
    id: string;
    email: string;
    nomeCompleto: string;
    prontuario: string | null;
    role: string;
    unidadeId: string | null;
  };
  unidades: UnidadeOption[];
}

export function FormularioEdicaoUsuario({
  usuario,
  unidades,
}: FormularioEdicaoProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    editarUsuarioAction,
    initialState
  );

  const [role, setRole] = useState<string>(usuario.role);
  const [unidadeId, setUnidadeId] = useState<string>(usuario.unidadeId ?? '');

  const precisaUnidade = ROLES_COM_UNIDADE.includes(role);
  const mudou = role !== usuario.role || unidadeId !== (usuario.unidadeId ?? '');

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={usuario.id} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Alterações salvas com sucesso.
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
          <CardTitle className="text-base">Dados do usuário</CardTitle>
          <CardDescription>
            O e-mail não pode ser alterado. Para trocar, crie um novo usuário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-readonly">E-mail (somente leitura)</Label>
            <Input
              id="email-readonly"
              value={usuario.email}
              disabled
              className="bg-slate-50"
            />
          </div>

          <div>
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input
              id="nomeCompleto"
              name="nomeCompleto"
              defaultValue={usuario.nomeCompleto}
            />
          </div>

          <div>
            <Label htmlFor="prontuario">
              Prontuário / matrícula funcional
            </Label>
            <Input
              id="prontuario"
              name="prontuario"
              defaultValue={usuario.prontuario ?? ''}
              placeholder="Ex.: 23.222"
            />
            <p className="text-xs text-slate-500 mt-1">
              Número exibido em relatórios oficiais (opcional).
            </p>
          </div>

          <div>
            <Label htmlFor="role-select">Perfil de acesso *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-select">
                <SelectValue />
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
                <SelectValue placeholder="Nenhuma" />
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
            {precisaUnidade && (
              <p className="text-xs text-amber-700 mt-1">
                Este perfil exige uma unidade vinculada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setRole(usuario.role);
            setUnidadeId(usuario.unidadeId ?? '');
            router.refresh();
          }}
        >
          Desfazer
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}