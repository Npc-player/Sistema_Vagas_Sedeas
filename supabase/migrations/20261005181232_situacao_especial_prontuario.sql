-- =====================================================
-- SITUAÇÃO ESPECIAL DE ACOLHIMENTO + PRONTUÁRIO DO USUÁRIO
-- =====================================================
-- 1. Prontuário do usuário (exibido em relatórios)
-- 2. Situação especial do acolhimento (evasão ou outros)
--    - Evasão: desligamento atípico sem formalização
--    - Outros: acolhido sob família extensa/substituta aguardando
--      parecer judicial (não conta como vaga disponível para
--      novos acolhimentos, mas permanece vinculado)
-- =====================================================

-- =====================================================
-- 1. Prontuário do usuário
-- =====================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prontuario TEXT;

COMMENT ON COLUMN profiles.prontuario IS 'Número de prontuário/funcional do servidor, exibido em relatórios oficiais';

-- =====================================================
-- 2. Situação especial do acolhimento
-- =====================================================
CREATE TYPE situacao_especial_acolhimento AS ENUM (
  'EVASAO',
  'OUTROS'
);

ALTER TABLE acolhimentos
  ADD COLUMN IF NOT EXISTS situacao_especial situacao_especial_acolhimento,
  ADD COLUMN IF NOT EXISTS situacao_outros_detalhe TEXT,
  ADD COLUMN IF NOT EXISTS situacao_especial_em DATE;

COMMENT ON COLUMN acolhimentos.situacao_especial IS 'Situação especial: EVASAO ou OUTROS (família extensa/substituta aguardando decisão)';
COMMENT ON COLUMN acolhimentos.situacao_outros_detalhe IS 'Detalhamento quando situacao_especial = OUTROS';
COMMENT ON COLUMN acolhimentos.situacao_especial_em IS 'Data em que a situação especial foi registrada';

-- Índice parcial para busca
CREATE INDEX IF NOT EXISTS acolhimentos_situacao_especial_idx
  ON acolhimentos (situacao_especial)
  WHERE situacao_especial IS NOT NULL;