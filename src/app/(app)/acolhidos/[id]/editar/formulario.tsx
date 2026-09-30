// src/app/(app)/acolhidos/[id]/editar/formulario.tsx
'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  editarAcolhidoSchema,
  type EditarAcolhidoInput,
} from '@/lib/validations/acolhido';
import {
  editarAcolhidoAction,
  type AcolhidoActionState,
} from '../../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

const initialState: AcolhidoActionState = {};

interface FormularioEdicaoProps {
  defaultValues: EditarAcolhidoInput;
}

export function FormularioEdicao({ defaultValues }: FormularioEdicaoProps) {
  const [state, formAction, isPending] = useActionState(
    editarAcolhidoAction,
    initialState
  );

  const {
    register,
    formState: { errors },
  } = useForm<EditarAcolhidoInput>({
    resolver: zodResolver(editarAcolhidoSchema),
    defaultValues,
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" {...register('id')} />

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

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-sm text-teal-900">
          <p className="font-medium mb-0.5">Dados sensíveis (LGPD)</p>
          <p className="text-xs leading-relaxed">
            Campos já preenchidos foram descriptografados para edição. Ao
            salvar, serão criptografados novamente. A alteração fica registrada
            em auditoria.
          </p>
        </div>
      </div>

      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input id="nomeCompleto" {...register('nomeCompleto')} />
            {errors.nomeCompleto && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nomeCompleto.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nomeSocial">Nome social</Label>
            <Input id="nomeSocial" {...register('nomeSocial')} />
            {errors.nomeSocial && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nomeSocial.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="dataNascimento">Data de nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('dataNascimento')}
            />
            {errors.dataNascimento && (
              <p className="text-sm text-red-600 mt-1">
                {errors.dataNascimento.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nomeMae">Nome da mãe</Label>
            <Input id="nomeMae" {...register('nomeMae')} />
            {errors.nomeMae && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nomeMae.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nomePai">Nome do pai</Label>
            <Input id="nomePai" {...register('nomePai')} />
            {errors.nomePai && (
              <p className="text-sm text-red-600 mt-1">
                {errors.nomePai.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" {...register('cpf')} />
            {errors.cpf && (
              <p className="text-sm text-red-600 mt-1">{errors.cpf.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="rg">RG</Label>
            <Input id="rg" {...register('rg')} />
            {errors.rg && (
              <p className="text-sm text-red-600 mt-1">{errors.rg.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saúde */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde</CardTitle>
          <CardDescription>
            Dados criptografados — visíveis apenas para perfis autorizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="alergias">Alergias</Label>
            <Textarea id="alergias" rows={2} {...register('alergias')} />
            {errors.alergias && (
              <p className="text-sm text-red-600 mt-1">
                {errors.alergias.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="comorbidades">Comorbidades</Label>
            <Textarea
              id="comorbidades"
              rows={2}
              {...register('comorbidades')}
            />
            {errors.comorbidades && (
              <p className="text-sm text-red-600 mt-1">
                {errors.comorbidades.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico familiar */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico familiar e rede de apoio</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="familiaHistorico"
            rows={4}
            {...register('familiaHistorico')}
          />
          {errors.familiaHistorico && (
            <p className="text-sm text-red-600 mt-1">
              {errors.familiaHistorico.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}