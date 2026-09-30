// src/lib/supabase/admin.ts
// Cliente Supabase com SERVICE_ROLE — apenas server-side.
// ⚠️ NUNCA importar em Client Components.
// Use exclusivamente em Server Actions / Route Handlers autenticados.

import { createClient } from '@supabase/supabase-js';

let clientInstance: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL não configurada');
  }
  if (!secretKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) não configurada — necessária para operações administrativas'
    );
  }

  clientInstance = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return clientInstance;
}