// src/app/(app)/unidades/nova/unidade-form.tsx
'use client';

import { useActionState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  unidadeSchema,
  type UnidadeInput,
  LABEL_TIPO_ACOLHIMENTO,
  LABEL_PUBLICO_ALVO,
  publicosAlvo,
  tiposAcolhimento,
} from '@/lib/validations/unidade';
import { criarUnidadeAction, type UnidadeActionState } from '../actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const initialState: UnidadeActionState = {};

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
      publicoAlvo: [],
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

      {/* Identificação */}
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
            <Label htmlFor="tipo">Tipo de serviço *</Label>
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
                {tiposAcolhimento.map((t) => (
                  <SelectItem key={t} value={t}>
                    {LABEL_TIPO_ACOLHIMENTO[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('tipo')} />
            {errors.tipo && (
              <p className="text-sm text-red-600 mt-1">{errors.tipo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              {...register('cnpj')}
            />
            {errors.cnpj && (
              <p className="text-sm text-red-600 mt-1">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
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

      {/* Público-alvo */}
      <Card>
        <CardHeader>
          <CardTitle>Público-alvo *</CardTitle>
          <CardDescription>
            Selecione todos os públicos atendidos por esta unidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="publicoAlvo"
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publicosAlvo.map((p) => {
                  const checked = field.value?.includes(p) ?? false;
                  return (
                    <label
                      key={p}
                      className="flex items-start gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          if (v) {
                            field.onChange([...(field.value ?? []), p]);
                          } else {
                            field.onChange(
                              (field.value ?? []).filter((x) => x !== p)
                            );
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700 leading-snug">
                        {LABEL_PUBLICO_ALVO[p]}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.publicoAlvo && (
            <p className="text-sm text-red-600 mt-2">
              {errors.publicoAlvo.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Endereço */}
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
            <Input id="cep" placeholder="00000-000" {...register('cep')} />
            {errors.cep && (
              <p className="text-sm text-red-600 mt-1">{errors.cep.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato institucional */}
      <Card>
        <CardHeader>
          <CardTitle>Contato institucional</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="telefoneInstitucional">Telefone *</Label>
            <Input
              id="telefoneInstitucional"
              placeholder="(00) 0000-0000"
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

      {/* Responsável técnico */}
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
            <Input
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

      {/* Equipe técnica de referência */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe técnica de referência</CardTitle>
          <CardDescription>
            Profissionais que atendem esta unidade. Serão exibidos nos
            relatórios mensais de fluxo de acolhimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="asVaraInfancia">
              Assistente Social Vara da Infância
            </Label>
            <Input
              id="asVaraInfancia"
              placeholder="Ex.: Patrícia"
              {...register('asVaraInfancia')}
            />
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
          </div>

          <div>
            <Label htmlFor="asCreas">Assistente Social CREAS</Label>
            <Input
              id="asCreas"
              placeholder="Ex.: Denise"
              {...register('asCreas')}
            />
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