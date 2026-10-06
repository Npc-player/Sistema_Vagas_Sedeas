// src/components/ui/input-telefone.tsx
'use client';

import { Input } from '@/components/ui/input';
import { type ComponentProps } from 'react';

/**
 * Formata um valor de telefone para o padrão brasileiro:
 *   (00) 0000-0000  → fixo
 *   (00) 00000-0000 → celular
 *
 * Aceita apenas dígitos como entrada e aplica a máscara automaticamente.
 */
export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

type InputTelefoneProps = Omit<ComponentProps<typeof Input>, 'type'>;

/**
 * Input de telefone com máscara automática.
 * O usuário digita apenas números; a formatação é aplicada em tempo real.
 */
export function InputTelefone({ onInput, ...props }: InputTelefoneProps) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      onInput={(e) => {
        const target = e.currentTarget;
        target.value = formatarTelefone(target.value);
        onInput?.(e);
      }}
    />
  );
}