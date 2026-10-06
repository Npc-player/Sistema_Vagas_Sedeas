// src/app/unidades/nova/unidade-form.tsx
'use client';

import { useActionState } from 'react';
// import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { unidadeSchema, type UnidadeInput } from '@/lib/validations/unidade';
import { criarUnidadeAction, type UnidadeActionState } from '../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, useWatch, Controller } from 'react-hook-form';
import Link from 'next/link';
import { InputTelefone } from '@/components/ui/input-telefone';
import { InputCnpj } from '@/components/ui/input-cnpj';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const initialState: UnidadeActionState = {};

const TIPOS = [
  { value: 'ILPI', label: 'ILPI — Instituição de Longa Permanência para Idosos' },
  { value: 'SAICA', label: 'SAICA — Acolhimento para Crianças e Adolescentes' },
  { value: 'CENTRO_DIA_IDOSO', label: 'Centro Dia do Idoso' },
  { value: 'SAI', label: 'SAI — Serviço de Acolhimento Institucional' },
  { value: 'RESIDENCIA_INCLUSIVA', label: 'R.I. — Residência Inclusiva' },
  { value: 'CASA_PASSAGEM', label: 'Casa de Passagem (acolhimento provisório)' },
] as const;

export function UnidadeForm() {
  const [state, formAction, isPending] = useActionState(
    criarUnidadeAction,
    initialState
  );

  const {
    register,
    formState: { errors },
    setValue,
    control,
  } = useForm<UnidadeInput>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      tipo: undefined,
    },
  });

  const tipoAtual = useWatch({ control, name: 'tipo' });

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
            <p className="font-medium mb-1">
              Corrija os campos destacados:
            </p>
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

      {/* ============ Identificação ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="nome">Nome da unidade *</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && (
              <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de acolhimento *</Label>
            <Select
              value={tipoAtual ?? ''}
              onValueChange={(v) =>
                setValue('tipo', v as UnidadeInput['tipo'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Input oculto para enviar o tipo no FormData */}
            <input type="hidden" {...register('tipo')} />
            {errors.tipo && (
              <p className="text-sm text-red-600 mt-1">{errors.tipo.message}</p>
            )}
          </div>

                    <Controller
            name="cnpj"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <InputCnpj
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          <div>
            <Label htmlFor="capacidadeTotal">Capacidade total de vagas *</Label>
            <Input
              id="capacidadeTotal"
              type="number"
              min={1}
              {...register('capacidadeTotal', { valueAsNumber: true })}
            />
            {errors.capacidadeTotal && (
              <p className="text-sm text-red-600 mt-1">
                {errors.capacidadeTotal.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ Endereço ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-4">
            <Label htmlFor="logradouro">Logradouro *</Label>
            <Input id="logradouro" {...register('logradouro')} />
            {errors.logradouro && (
              <p className="text-sm text-red-600 mt-1">
                {errors.logradouro.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="numero">Número *</Label>
            <Input id="numero" {...register('numero')} />
            {errors.numero && (
              <p className="text-sm text-red-600 mt-1">
                {errors.numero.message}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" {...register('complemento')} />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="bairro">Bairro *</Label>
            <Input id="bairro" {...register('bairro')} />
            {errors.bairro && (
              <p className="text-sm text-red-600 mt-1">
                {errors.bairro.message}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input id="cidade" {...register('cidade')} />
            {errors.cidade && (
              <p className="text-sm text-red-600 mt-1">
                {errors.cidade.message}
              </p>
            )}
          </div>

          <div className="md:col-span-1">
            <Label htmlFor="uf">UF *</Label>
            <Input
              id="uf"
              maxLength={2}
              placeholder="SP"
              {...register('uf')}
              onChange={(e) =>
                setValue('uf', e.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
            />
            {errors.uf && (
              <p className="text-sm text-red-600 mt-1">{errors.uf.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="cep">CEP *</Label>
            <Input
              id="cep"
              placeholder="00000-000"
              {...register('cep')}
            />
            {errors.cep && (
              <p className="text-sm text-red-600 mt-1">{errors.cep.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ Contato institucional ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Contato institucional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="telefoneInstitucional">Telefone *</Label>
            <InputTelefone
              id="telefoneInstitucional"
              placeholder="(00) 00000-0000"
              {...register('telefoneInstitucional')}
            />
            {errors.telefoneInstitucional && (
              <p className="text-sm text-red-600 mt-1">
                {errors.telefoneInstitucional.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="emailInstitucional">E-mail *</Label>
            <Input
              id="emailInstitucional"
              type="email"
              {...register('emailInstitucional')}
            />
            {errors.emailInstitucional && (
              <p className="text-sm text-red-600 mt-1">
                {errors.emailInstitucional.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ Responsável técnico ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Responsável técnico</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="responsavelNome">Nome completo *</Label>
            <Input id="responsavelNome" {...register('responsavelNome')} />
            {errors.responsavelNome && (
              <p className="text-sm text-red-600 mt-1">
                {errors.responsavelNome.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="responsavelTelefone">Telefone *</Label>
            <InputTelefone
              id="responsavelTelefone"
              placeholder="(00) 00000-0000"
              {...register('responsavelTelefone')}
            />
            {errors.responsavelTelefone && (
              <p className="text-sm text-red-600 mt-1">
                {errors.responsavelTelefone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="responsavelEmail">E-mail *</Label>
            <Input
              id="responsavelEmail"
              type="email"
              {...register('responsavelEmail')}
            />
            {errors.responsavelEmail && (
              <p className="text-sm text-red-600 mt-1">
                {errors.responsavelEmail.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============ Equipe técnica de referência ============ */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe técnica de referência</CardTitle>
          <CardDescription>
            Profissionais que atendem esta unidade. Serão exibidos nos
            relatórios mensais de fluxo de acolhimento.
          </CardDescription>
        </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="asVaraInfancia">
              Assistente Social Vara da Infância
            </Label>
            <Input
              id="asVaraInfancia"
              placeholder="Ex.: Patrícia"
              {...register('asVaraInfancia')}
            />
            {errors.asVaraInfancia && (
              <p className="text-sm text-red-600 mt-1">
                {errors.asVaraInfancia.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="psicVaraInfancia">
              Psicólogo(a) Vara da Infância
            </Label>
            <Input
              id="psicVaraInfancia"
              placeholder="Ex.: Tainá"
              {...register('psicVaraInfancia')}
            />
            {errors.psicVaraInfancia && (
              <p className="text-sm text-red-600 mt-1">
                {errors.psicVaraInfancia.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="asCreas">Assistente Social CREAS</Label>
            <Input
              id="asCreas"
              placeholder="Ex.: Denise"
              {...register('asCreas')}
            />
            {errors.asCreas && (
              <p className="text-sm text-red-600 mt-1">
                {errors.asCreas.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="psicCreas">Psicólogo(a) CREAS</Label>
            <Input
              id="psicCreas"
              placeholder="Ex.: Mariana"
              {...register('psicCreas')}
            />
            {errors.psicCreas && (
              <p className="text-sm text-red-600 mt-1">
                {errors.psicCreas.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/unidades">
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Cadastrar unidade'}
        </Button>
      </div>
    </form>
  );
}