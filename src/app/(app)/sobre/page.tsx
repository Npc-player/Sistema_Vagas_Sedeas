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

const VERSAO = '1.2.0';
const DATA_VERSAO = 'outubro/2026';

const NOTAS_VERSAO = [
  'Filtros avançados em Controle de Vagas: tipo de serviço e unidade, com aplicação aos indicadores e à tabela consolidada.',
  'Separação da listagem de Pessoas Acolhidas em duas abas: pessoas em acolhimento ativo e pessoas cadastradas sem vínculo.',
  'Filtros em Pessoas Acolhidas: nome (busca parcial), CPF (via hash HMAC criptografado) e número de medida protetiva.',
  'Nova tipificação nacional de serviços socioassistenciais: Abrigo Institucional, Casa Lar, Casa de Passagem, Residência Inclusiva, República, Família Acolhedora e Proteção em Calamidades Públicas e Emergências.',
  'Cadastro de público-alvo por unidade com seleção múltipla (crianças e adolescentes, jovens egressos, pessoas idosas, população em situação de rua, mulheres em situação de violência, migrantes, famílias desabrigadas, entre outros).',
  'Compatibilidade etária (RN-01) agora considera o público-alvo cadastrado na unidade.',
  'Alerta automático de maioridade (RN-07) passa a identificar adolescentes por público-alvo, não mais por tipo de serviço.',
  'Módulo completo de Cadastro de Unidades com mapa visual de vagas (disponível, ocupada, bloqueada, reservada).',
  'Controle de Vagas com bloqueio/desbloqueio por motivo formal e prazo estimado (RN-08).',
  'Cadastro de Pessoas Acolhidas com criptografia em repouso (AES-256 via pgcrypto) de CPF, RG, alergias e comorbidades.',
  'Fluxo de Admissão com protocolo único rastreável, validação de compatibilidade etária e limite de capacidade (RN-02).',
  'Fluxo de Desacolhimento com coerência cronológica (RN-05) e liberação automática de vaga.',
  'Situações especiais (evasão e casos sob família extensa/substituta aguardando decisão judicial) com contabilização separada nos relatórios.',
  'Campos processuais no acolhimento: número do processo, medida protetiva, guia de acolhimento e território.',
  'Equipe técnica de referência por unidade (Assistente Social e Psicólogo da Vara da Infância, Assistente Social do CREAS) com possibilidade de override por acolhimento.',
  'Dashboard com indicadores consolidados e filtros por tipo de serviço e unidade.',
  'Trilha de auditoria imutável (LGPD Art. 37) com registro de CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT e EXPORT.',
  'Painel de auditoria com filtros avançados e visualização detalhada com diff campo-a-campo.',
  'Exportação de trilha de auditoria em PDF com justificativa legal obrigatória e protocolo único.',
  'Módulo de relatórios: Central de Regulação de Vagas (Institucional e Provisório) e Fluxo Mensal Detalhado (nominal), com exportação em PDF.',
  'Administração de Usuários com criação via Admin API, RBAC, prontuário funcional e auditoria completa.',
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
          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            Sistema web para centralização do controle de vagas e gestão das
            pessoas acolhidas nos diferentes serviços de acolhimento
            socioassistencial do município, conforme a Tipificação Nacional de
            Serviços Socioassistenciais:
          </p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside mb-3">
            <li>
              <strong>Abrigo Institucional</strong> — acolhimento provisório
              para crianças, adolescentes, jovens, adultos, famílias e pessoas
              idosas
            </li>
            <li>
              <strong>Casa Lar</strong> — acolhimento em unidades residenciais
              de pequeno porte
            </li>
            <li>
              <strong>Casa de Passagem</strong> — acolhimento provisório de
              curta duração
            </li>
            <li>
              <strong>Residência Inclusiva</strong> — para jovens e adultos com
              deficiência
            </li>
            <li>
              <strong>República</strong> — para jovens e adultos em processo de
              saída de serviços de acolhimento
            </li>
            <li>
              <strong>Família Acolhedora</strong> — acolhimento familiar
              provisório
            </li>
            <li>
              <strong>Proteção em Calamidades Públicas e Emergências</strong> —
              para famílias e indivíduos em situações emergenciais
            </li>
          </ul>
          <p className="text-sm text-slate-700 leading-relaxed">
            O sistema oferece rastreabilidade completa com trilha de auditoria
            imutável, criptografia de dados sensíveis (LGPD), controle de
            acesso baseado em perfis (RBAC), isolamento de dados por unidade
            (RLS) e módulo de interoperabilidade supervisionada para o Poder
            Judiciário e Ministério Público.
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