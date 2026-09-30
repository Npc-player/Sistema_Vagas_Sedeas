// src/app/(app)/judiciario/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/rbac';
import { ConsultaJudicial } from './consulta-judicial';

export default async function JudiciarioPage() {
  const session = await getSession();

  if (!session) redirect('/login');

  // Apenas JUDICIARIO_MP e ADMIN_MUNICIPAL
  if (
    session.role !== 'JUDICIARIO_MP' &&
    session.role !== 'ADMIN_MUNICIPAL'
  ) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
          Acesso Supervisionado
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Consulta Judiciária
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Consulta a registros individuais vinculados a procedimentos legais.
          Toda operação é registrada em trilha de auditoria imutável.
        </p>
      </div>

      {/* Aviso LGPD */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <div className="text-sm text-amber-900">
          <p className="font-medium mb-0.5">
            Finalidade e responsabilidade
          </p>
          <p className="text-xs leading-relaxed">
            As consultas são permitidas apenas para fins vinculados a
            procedimentos legais em curso. A justificativa informada é gravada
            de forma imutável junto ao protocolo único. Dados de saúde dos
            acolhidos <strong>não são exibidos</strong> neste módulo — apenas
            indicados como existentes (LGPD Art. 11).
          </p>
        </div>
      </div>

      <ConsultaJudicial />
    </div>
  );
}