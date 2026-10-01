-- =====================================================
-- MÓDULO DPO — Encarregado pelo Tratamento de Dados (LGPD Art. 41)
-- =====================================================
-- Duas tabelas:
--   1. dpo_configuracao  — dados do Encarregado (single-row, editável)
--   2. lgpd_requisicoes  — canal para titulares exercerem seus direitos
-- =====================================================

-- =====================================================
-- TABELA: dpo_configuracao (single row)
-- =====================================================
CREATE TABLE dpo_configuracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT,
  endereco TEXT,
  horario_atendimento TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que só existe 1 registro ativo
CREATE UNIQUE INDEX dpo_configuracao_ativa_unique
  ON dpo_configuracao (ativo)
  WHERE ativo = TRUE;

-- =====================================================
-- ENUM: status da requisição LGPD
-- =====================================================
CREATE TYPE lgpd_requisicao_status AS ENUM (
  'RECEBIDA',
  'EM_ANALISE',
  'RESPONDIDA',
  'ARQUIVADA'
);

CREATE TYPE lgpd_tipo_requisicao AS ENUM (
  'ACESSO',
  'CORRECAO',
  'EXCLUSAO',
  'PORTABILIDADE',
  'INFORMACAO_COMPARTILHAMENTO',
  'REVOGACAO_CONSENTIMENTO',
  'OUTRO'
);

-- =====================================================
-- TABELA: lgpd_requisicoes
-- =====================================================
CREATE TABLE lgpd_requisicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL UNIQUE,
  tipo lgpd_tipo_requisicao NOT NULL,
  status lgpd_requisicao_status NOT NULL DEFAULT 'RECEBIDA',

  -- Dados do requerente
  requerente_nome TEXT NOT NULL,
  requerente_email TEXT NOT NULL,
  requerente_telefone TEXT,
  requerente_cpf_hash TEXT, -- HMAC para vincular a acolhidos sem expor CPF
  descricao TEXT NOT NULL,

  -- Resposta
  resposta TEXT,
  respondido_por_user_id UUID REFERENCES auth.users(id),
  respondido_em TIMESTAMPTZ,
  prazo_resposta DATE, -- 15 dias conforme boas práticas LGPD

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX lgpd_requisicoes_status_idx ON lgpd_requisicoes (status);
CREATE INDEX lgpd_requisicoes_created_idx ON lgpd_requisicoes (created_at DESC);

-- =====================================================
-- SEQUENCE de protocolo da requisição
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS lgpd_requisicao_protocolo_seq
  START WITH 1 INCREMENT BY 1 NO MAXVALUE CACHE 1;

CREATE OR REPLACE FUNCTION private.gerar_protocolo_lgpd()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    'LGPD-' ||
    TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('public.lgpd_requisicao_protocolo_seq')::text, 6, '0');
$$;

REVOKE EXECUTE ON FUNCTION private.gerar_protocolo_lgpd() FROM PUBLIC, anon, authenticated;

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE dpo_configuracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_requisicoes ENABLE ROW LEVEL SECURITY;

-- DPO_CONFIGURACAO: todos autenticados leem; só Admin escreve
CREATE POLICY dpo_config_read_all ON dpo_configuracao
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY dpo_config_write_admin ON dpo_configuracao
  FOR ALL
  USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- LGPD_REQUISICOES: só Admin vê/gerencia (pode evoluir para perfil DPO futuro)
CREATE POLICY lgpd_requisicoes_admin_all ON lgpd_requisicoes
  FOR ALL
  USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- =====================================================
-- GRANTs
-- =====================================================
GRANT SELECT ON public.dpo_configuracao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_requisicoes TO authenticated;

-- Anon pode ler a config do DPO (será útil numa futura página pública)
GRANT SELECT ON public.dpo_configuracao TO anon;

-- =====================================================
-- INSERT inicial da configuração do DPO (placeholder)
-- =====================================================
INSERT INTO dpo_configuracao (
  nome_completo,
  email,
  cargo,
  horario_atendimento,
  observacoes
) VALUES (
  'A definir',
  'dpo@sedecas.gov.br',
  'Encarregado pelo Tratamento de Dados Pessoais (DPO)',
  'Segunda a sexta, das 8h às 17h',
  'Configuração inicial — atualize com os dados do responsável nomeado.'
);