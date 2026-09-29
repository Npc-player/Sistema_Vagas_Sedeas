// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logoutAction } from '../login/actions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade: o proxy já redireciona, mas garantimos aqui também
  if (!user) {
    redirect('/login');
  }

  // Busca o profile via Supabase client — o JWT é enviado automaticamente,
  // então o RLS (profiles_self_read) permite a leitura.
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_completo, role, ativo')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Sistema de Controle de Vagas
            </h1>
            <p className="text-xs text-gray-500">
              Secretaria Municipal de Assistência Social
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-gray-700 hover:text-gray-900
                         px-3 py-2 rounded-md border border-gray-300
                         hover:bg-gray-50 transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bem-vindo(a)
          </h2>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {profile?.nome_completo ?? 'Não cadastrado'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">E-mail</dt>
              <dd className="text-sm text-gray-900 mt-1">{user.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Perfil</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {profile?.role ?? 'Não definido'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {profile?.ativo ? 'Ativo' : 'Inativo'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Próximo passo:</strong> o dashboard com indicadores de
            ocupação será construído nas próximas etapas.
          </p>
        </div>
      </main>
    </div>
  );
}