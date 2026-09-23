// scripts/test-db.mjs
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

// Carrega .env.local manualmente (sem depender do Next.js)
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const url = envContent
  .split('\n')
  .find((line) => line.startsWith('POSTGRES_URL='))
  ?.replace('POSTGRES_URL=', '')
  .trim()
  .replace(/^"|"$/g, '');

if (!url) {
  console.error('POSTGRES_URL não encontrada');
  process.exit(1);
}

// Mostra a estrutura da URL SEM expor a senha
try {
  const parsed = new URL(url);
  console.log('--- Estrutura da URL ---');
  console.log('protocol:', parsed.protocol);
  console.log('host:', parsed.host);
  console.log('port:', parsed.port);
  console.log('database:', parsed.pathname);
  console.log('user:', parsed.username);
  console.log('senha tem tamanho:', parsed.password.length);
} catch (e) {
  console.error('URL inválida:', e.message);
  process.exit(1);
}

console.log('\n--- Testando conexão ---');
const sql = postgres(url, {
  prepare: false,
  max: 1,
  idle_timeout: 10,
});

try {
  const result = await sql`SELECT version() as version`;
  console.log('SUCESSO:', result[0].version);
} catch (error) {
  console.error('ERRO COMPLETO:');
  console.error('  message:', error.message);
  console.error('  code:', error.code);
  console.error('  detail:', error.detail);
  console.error('  hint:', error.hint);
  console.error('  severity:', error.severity);
} finally {
  await sql.end();
}
