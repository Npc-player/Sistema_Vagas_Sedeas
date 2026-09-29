// src/lib/supabase/client.ts
// Cliente Supabase para uso em Client Components ('use client')
// Usa a chave pública (anon/publishable) — NUNCA a service_role aqui.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórias'
    );
  }

  return createBrowserClient(url, key);
}
