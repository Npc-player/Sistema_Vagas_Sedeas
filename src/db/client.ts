// src/db/client.ts — RUNTIME (usa DATABASE_URL pooled com prepare: false)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const queryClient = postgres(process.env.DATABASE_URL!, {
  prepare: false,   // ⚠️ OBRIGATÓRIO para Supavisor Transaction mode
  max: 1,           // 1 conexão por instância serverless
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle(queryClient, { schema });
