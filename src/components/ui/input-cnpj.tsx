// src/components/ui/input-cnpj.tsx
'use client';

import { Input } from '@/components/ui/input';
import { type ComponentProps } from 'react';

export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  }
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

interface InputCnpjProps
  extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (v: string) => void;
}

export function InputCnpj({
  value,
  onValueChange,
  ...props
}: InputCnpjProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onValueChange(formatarCnpj(e.target.value))}
    />
  );
}