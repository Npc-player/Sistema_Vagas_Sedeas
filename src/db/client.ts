// src/db/client.ts — RUNTIME (usa POSTGRES_URL pooled com prepare: false)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL não está definida nas variáveis de ambiente');
}

const queryClient = postgres(connectionString, {
  prepare: false,        // OBRIGATÓRIO para Supavisor Transaction mode
  max: 1,                // 1 conexão por instância serverless
  idle_timeout: 90,      // mantém conexão quente por mais tempo
  max_lifetime: 60 * 30, // recicla a cada 30 minutos
  connect_timeout: 15,   // falha rápido se não conectar em 15s
});

export const db = drizzle(queryClient, { schema });