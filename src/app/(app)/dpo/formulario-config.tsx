// src/app/(app)/dpo/formulario-config.tsx
'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  configuracaoDpoSchema,
  type ConfiguracaoDpoInput,
} from '@/lib/validations/dpo';
import { atualizarDpoConfigAction, type DpoActionState } from './actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, UserCog } from 'lucide-react';

const initialState: DpoActionState = {};

interface FormularioConfigProps {
  defaultValues: ConfiguracaoDpoInput;
  podeEditar: boolean;
}

export function FormularioConfigDpo({
  defaultValues,
  podeEditar,
}: FormularioConfigProps) {
  const [state, formAction, isPending] = useActionState(
    atualizarDpoConfigAction,
    initialState
  );

  const {
    register,
    formState: { errors },
  } = useForm<ConfiguracaoDpoInput>({
    resolver: zodResolver(configuracaoDpoSchema),
    defaultValues,
  });

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCog className="w-4 h-4 text-teal-700" />
          Encarregado pelo Tratamento de Dados (DPO)
        </CardTitle>
        <CardDescription>
          {podeEditar
            ? 'Atualize os dados do responsável nomeado. As alterações são registradas em auditoria.'
            : 'Dados do Encarregado em exercício. Apenas o Administrador Municipal pode editar.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.success && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <AlertDescription className="text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Configuração atualizada com sucesso.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nomeCompleto">Nome completo *</Label>
              <Input
                id="nomeCompleto"
                disabled={!podeEditar}
                {...register('nomeCompleto')}
              />
              {errors.nomeCompleto && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.nomeCompleto.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">E-mail de contato *</Label>
              <Input
                id="email"
                type="email"
                disabled={!podeEditar}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                disabled={!podeEditar}
                {...register('telefone')}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="cargo">Cargo / função</Label>
              <Input
                id="cargo"
                disabled={!podeEditar}
                {...register('cargo')}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço para atendimento</Label>
              <Input
                id="endereco"
                disabled={!podeEditar}
                {...register('endereco')}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="horarioAtendimento">Horário de atendimento</Label>
              <Input
                id="horarioAtendimento"
                disabled={!podeEditar}
                placeholder="Ex.: Segunda a sexta, das 8h às 17h"
                {...register('horarioAtendimento')}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                disabled={!podeEditar}
                {...register('observacoes')}
              />
            </div>
          </div>

          {podeEditar && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}