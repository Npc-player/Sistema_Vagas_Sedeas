// src/app/(app)/dashboard/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] erro:', error);
  }, [error]);

  const ehTimeout =
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('canceling statement');
  const ehConexao =
    error.message?.toLowerCase().includes('econnreset') ||
    error.message?.toLowerCase().includes('connection') ||
    error.message?.toLowerCase().includes('fetch');

  let mensagem = 'Erro inesperado ao carregar os indicadores.';
  let detalhe = 'Tente novamente. Se persistir, contate a equipe de TI.';

  if (ehTimeout) {
    mensagem = 'A consulta demorou mais que o esperado.';
    detalhe =
      'O banco de dados pode estar temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.';
  } else if (ehConexao) {
    mensagem = 'Não foi possível conectar ao servidor.';
    detalhe =
      'Verifique sua conexão com a internet. Se o problema persistir, o serviço pode estar temporariamente indisponível.';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white border border-rose-200 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 mb-4">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
        </div>

        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          {mensagem}
        </h1>
        <p className="text-sm text-slate-600 mb-6">{detalhe}</p>

        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}

        <div className="flex justify-center gap-3 flex-wrap">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Tentar novamente
          </Button>
          <Link href="/modulos">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-1.5" />
              Ir para Módulos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}