// src/app/(app)/acolhidos/novo/formulario.tsx
'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  acolhidoSchema,
  type AcolhidoInput,
} from '@/lib/validations/acolhido';
import {
  criarAcolhidoAction,
  type AcolhidoActionState,
} from '../actions';

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
import { Link, ShieldAlert } from 'lucide-react';

const initialState: AcolhidoActionState = {};

export function FormularioAcolhido() {
  const [state, formAction, isPending] = useActionState(
    criarAcolhidoAction,
    initialState
  );

  const {
    register,
    formState: { errors },
  } = useForm<AcolhidoInput>({
    resolver: zodResolver(acolhidoSchema),
    defaultValues: {
      nomeCompleto: '',
      nomeSocial: '',
      dataNascimento: '',
      nomeMae: '',
      nomePai: '',
      cpf: '',
      rg: '',
      alergias: '',
      comorbidades: '',
      familiaHistorico: '',
    },
  });

  return (
    <form action={formAction} className="space-y-6">
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

      {/* Aviso LGPD */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-sm text-teal-900">
          <p className="font-medium mb-0.5">Dados sensíveis (LGPD)</p>
          <p className="text-xs leading-relaxed">
            Os campos de CPF, RG, alergias e comorbidades são criptografados
            em repouso (AES-256). Nunca serão gravados em logs de auditoria.
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
            <Input
              id="nomeCompleto"
              autoComplete="off"
              {...register('nomeCompleto')}
            />
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
          <CardDescription>
            Opcionais no cadastro — podem ser completados depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              autoComplete="off"
              {...register('cpf')}
            />
            {errors.cpf && (
              <p className="text-sm text-red-600 mt-1">{errors.cpf.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              placeholder="00.000.000-0"
              {...register('rg')}
            />
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
            <Textarea
              id="alergias"
              rows={2}
              placeholder="Ex.: penicilina, dipirona, látex..."
              {...register('alergias')}
            />
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
              placeholder="Ex.: hipertensão, diabetes tipo 2..."
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
            placeholder="Composição familiar, referências comunitárias, contatos..."
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
        <Link href="/acolhidos">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Cadastrar pessoa'}
        </Button>
      </div>
    </form>
  );
}