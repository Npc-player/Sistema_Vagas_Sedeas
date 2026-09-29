// src/app/login/page.tsx
'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Controle de Vagas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Secretaria Municipal de Assistência Social
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent text-gray-900"
              placeholder="seu.email@exemplo.gov.br"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <div
              role="alert"
              className="text-sm text-red-700 bg-red-50 border border-red-200
                         rounded-md px-3 py-2"
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4
                       rounded-md hover:bg-blue-700 focus:outline-none
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Acesso restrito. Todas as ações são registradas em auditoria.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginForm />
    </Suspense>
  );
}
