import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Testa conexão e lê a versão do PostgreSQL
    const result = await db.execute(sql`SELECT version() as version`);
    const version = (result[0] as { version: string }).version;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      postgresVersion: version.split(' ').slice(0, 2).join(' '),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}