// src/db/client.ts — RUNTIME (usa POSTGRES_URL pooled com prepare: false)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL não está definida nas variáveis de ambiente');
}

const queryClient = postgres(connectionString, {
  prepare: false,   // OBRIGATÓRIO para Supavisor Transaction mode
  max: 1,           // 1 conexão por instância serverless
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle(queryClient, { schema });