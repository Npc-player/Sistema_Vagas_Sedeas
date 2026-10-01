// src/app/(app)/sobre/page.tsx
import { getSession } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Info,
  Building2,
  Users,
  Code2,
  Calendar,
  FileText,
  Award,
  Mail,
} from 'lucide-react';

const VERSAO = '1.0.0';
const DATA_VERSAO = 'outubro/2026';

const NOTAS_VERSAO = [
  'Módulo completo de Cadastro de Unidades com mapa visual de vagas (disponível, ocupada, bloqueada, reservada).',
  'Controle de Vagas com bloqueio/desbloqueio por motivo formal e prazo estimado (RN-08).',
  'Cadastro de Pessoas Acolhidas com criptografia em repouso (AES-256 via pgcrypto) de CPF, RG, alergias e comorbidades.',
  'Fluxo de Admissão com protocolo único rastreável, validação de compatibilidade etária (RN-01) e limite de capacidade (RN-02).',
  'Fluxo de Desacolhimento com coerência cronológica (RN-05) e liberação automática de vaga.',
  'Dashboard com indicadores consolidados e filtros por tipo de acolhimento e unidade.',
  'Alerta automático de maioridade em SAICA — 17 anos e 6 meses (RN-07).',
  'Trilha de auditoria imutável (LGPD Art. 37) com registro de CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT e EXPORT.',
  'Painel de auditoria com filtros avançados (usuário, ação, entidade, período) e visualização detalhada com diff campo-a-campo.',
  'Exportação de trilha de auditoria em PDF com justificativa legal obrigatória e protocolo único.',
  'Administração de Usuários com criação via Admin API, RBAC e auditoria completa.',
  'Consulta Judiciária com mascaramento de dados sensíveis, justificativa obrigatória e protocolo de auditoria.',
  'Encarregado pelo Tratamento de Dados (DPO) configurável e canal de requisições LGPD (Art. 41).',
  'Perfil do usuário com troca de senha auditada e requisitos de senha forte.',
  'Row-Level Security (RLS) em todas as tabelas sensíveis, com isolamento por unidade institucional.',
];

export default async function SobrePage() {
  const session = await getSession();

  if (!session) redirect('/login');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 border border-teal-100 mb-3">
          <Info className="w-7 h-7 text-teal-700" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Sobre o Sistema
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Sistema de Controle de Vagas em Acolhimentos Municipais
        </p>
      </div>

      {/* Versão */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-700" />
            Versão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className="bg-teal-700 hover:bg-teal-700 text-white text-sm px-3 py-1">
              v{VERSAO}
            </Badge>
            <span className="text-sm text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {DATA_VERSAO}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-700" />
            Descrição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">
            Sistema web para centralização do controle de vagas e gestão das
            pessoas acolhidas nos diferentes tipos de acolhimentos municipais
            — ILPI (Instituição de Longa Permanência para Idosos), SAICA
            (Serviço de Acolhimento Institucional para Crianças e
            Adolescentes), Centro Dia Idoso, José Calherani e Residência
            Inclusiva. O sistema oferece rastreabilidade completa com trilha
            de auditoria imutável, criptografia de dados sensíveis (LGPD),
            controle de acesso baseado em perfis (RBAC), isolamento de dados
            por unidade (RLS) e módulo de interoperabilidade supervisionada
            para o Poder Judiciário e Ministério Público.
          </p>
        </CardContent>
      </Card>

      {/* Notas da versão */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-700" />
            Notas da Versão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            {NOTAS_VERSAO.map((nota, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-teal-700 mt-1.5 shrink-0">•</span>
                <span className="leading-relaxed">{nota}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Órgão responsável */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            Órgão Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Secretaria de Desenvolvimento e Assistência Social (SEDEAS)
            </p>
            <p className="text-xs text-slate-500">
              Prefeitura Municipal de Guarujá
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Secretário
              </p>
              <p className="text-sm text-slate-900 mt-0.5">
                Fernando Antonio de Almeida Monte
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Chefe da Vigilância Socioassistencial
              </p>
              <p className="text-sm text-slate-900 mt-0.5">
                Rafael Garcia Morcillo Junior
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desenvolvimento */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-700" />
            Desenvolvimento e Programação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Rafael Garcia Morcillo Junior
            </p>
            <p className="text-sm font-medium text-slate-900 mt-2">
              Nelson Carvalho
            </p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              nelson77carvalho@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Colaboradores */}
      <Card className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            Colaboradores / Agradecimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            À toda a equipe da SEDEAS e à Vigilância Socioassistencial do
            município de Guarujá, pelo apoio no levantamento de requisitos,
            validação das regras de negócio e testes do sistema.
          </p>
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="text-center pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          © 2026 SEDEAS — Secretaria de Desenvolvimento e Assistência Social
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">v{VERSAO}</p>
      </div>
    </div>
  );
}