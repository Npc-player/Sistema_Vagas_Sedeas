-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE user_role AS ENUM (
  'ADMIN_MUNICIPAL', 'GESTOR_ACOLHIMENTO', 'OPERADOR',
  'CONSELHO_MUNICIPAL', 'JUDICIARIO_MP', 'TI_SUPORTE'
);

CREATE TYPE tipo_acolhimento AS ENUM (
  'ILPI', 'SAICA', 'CENTRO_DIA_IDOSO', 'JOSE_CALHERANI', 'RESIDENCIA_INCLUSIVA'
);

CREATE TYPE status_vaga AS ENUM ('DISPONIVEL', 'OCUPADA', 'BLOQUEADA', 'RESERVADA');
CREATE TYPE regime_acolhimento AS ENUM ('PROVISORIO', 'DEFINITIVO');
CREATE TYPE motivo_desacolhimento AS ENUM (
  'REINTEGRACAO_FAMILIAR', 'TRANSFERENCIA', 'MAIORIDADE', 'OBITO', 'DECISAO_JUDICIAL'
);

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABELA: profiles
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  role user_role NOT NULL,
  unidade_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA: unidades
-- =====================================================
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo tipo_acolhimento NOT NULL,
  cnpj TEXT,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  cep TEXT NOT NULL,
  telefone_institucional TEXT NOT NULL,
  email_institucional TEXT NOT NULL,
  capacidade_total INTEGER NOT NULL,
  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT NOT NULL,
  responsavel_email TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_unidade
  FOREIGN KEY (unidade_id) REFERENCES unidades(id);

-- =====================================================
-- TABELA: acolhidos
-- =====================================================
CREATE TABLE acolhidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  data_nascimento DATE NOT NULL,
  nome_mae TEXT,
  nome_pai TEXT,
  cpf_encrypted BYTEA,
  cpf_hash TEXT,
  rg_encrypted BYTEA,
  alergias_encrypted BYTEA,
  comorbidades_encrypted BYTEA,
  familia_historico TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acolhidos_cpf_hash ON acolhidos(cpf_hash);
CREATE INDEX idx_acolhidos_nome ON acolhidos(nome_completo);

-- =====================================================
-- TABELA: acolhimentos
-- =====================================================
CREATE TABLE acolhimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acolhido_id UUID NOT NULL REFERENCES acolhidos(id),
  unidade_id UUID NOT NULL REFERENCES unidades(id),
  data_acolhimento DATE NOT NULL,
  motivo_acolhimento TEXT NOT NULL,
  motivo_detalhe TEXT,
  regime regime_acolhimento NOT NULL,
  data_desacolhimento DATE,
  motivo_desacolhimento motivo_desacolhimento,
  motivo_desacolhimento_detalhe TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por_user_id UUID NOT NULL REFERENCES auth.users(id),
  protocolo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acolhimentos_acolhido ON acolhimentos(acolhido_id);
CREATE INDEX idx_acolhimentos_unidade ON acolhimentos(unidade_id);
CREATE INDEX idx_acolhimentos_ativo ON acolhimentos(ativo) WHERE ativo = TRUE;

-- =====================================================
-- TABELA: vagas
-- =====================================================
CREATE TABLE vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES unidades(id),
  numero_leito INTEGER NOT NULL,
  status status_vaga NOT NULL DEFAULT 'DISPONIVEL',
  motivo_bloqueio TEXT,
  prazo_bloqueio DATE,
  reservada_para_acolhido_id UUID REFERENCES acolhidos(id),
  reservada_ate TIMESTAMPTZ,
  acolhimento_atual_id UUID REFERENCES acolhimentos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(unidade_id, numero_leito)
);

CREATE INDEX idx_vagas_status ON vagas(status);

-- =====================================================
-- TABELA: audit_log
-- =====================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  before JSONB,
  after JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);