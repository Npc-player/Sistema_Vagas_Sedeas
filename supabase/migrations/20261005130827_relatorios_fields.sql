-- =====================================================
-- MÓDULO DE RELATÓRIOS — campos e enums
-- =====================================================
-- Adiciona:
--   1. Equipe técnica fixa por unidade (AS/Psic da Vara, AS do CREAS)
--   2. Dados processuais no acolhimento (processo, medida, guia, território)
--   3. Grupo familiar no acolhido (para agrupamento manual de irmãos)
--   4. Novo tipo de unidade: CASA_PASSAGEM (acolhimento provisório)
--   5. Novo motivo de desacolhimento: EVASAO
-- =====================================================

-- =====================================================
-- 1. Equipe técnica por unidade
-- =====================================================
ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS as_vara_infancia TEXT,
  ADD COLUMN IF NOT EXISTS psic_vara_infancia TEXT,
  ADD COLUMN IF NOT EXISTS as_creas TEXT;

COMMENT ON COLUMN unidades.as_vara_infancia IS 'Assistente Social de referência da Vara da Infância';
COMMENT ON COLUMN unidades.psic_vara_infancia IS 'Psicólogo(a) de referência da Vara da Infância';
COMMENT ON COLUMN unidades.as_creas IS 'Assistente Social de referência do CREAS';

-- =====================================================
-- 2. Dados processuais e territoriais no acolhimento
-- =====================================================
ALTER TABLE acolhimentos
  ADD COLUMN IF NOT EXISTS numero_processo TEXT,
  ADD COLUMN IF NOT EXISTS numero_medida_protetiva TEXT,
  ADD COLUMN IF NOT EXISTS numero_guia_acolhimento TEXT,
  ADD COLUMN IF NOT EXISTS territorio TEXT;

COMMENT ON COLUMN acolhimentos.numero_processo IS 'Número do processo judicial vinculado';
COMMENT ON COLUMN acolhimentos.numero_medida_protetiva IS 'Número da medida protetiva';
COMMENT ON COLUMN acolhimentos.numero_guia_acolhimento IS 'Número da guia de acolhimento';
COMMENT ON COLUMN acolhimentos.territorio IS 'Território/bairro/região de origem do caso';

-- Índices para busca
CREATE INDEX IF NOT EXISTS acolhimentos_numero_processo_idx
  ON acolhimentos (numero_processo)
  WHERE numero_processo IS NOT NULL;

CREATE INDEX IF NOT EXISTS acolhimentos_numero_guia_idx
  ON acolhimentos (numero_guia_acolhimento)
  WHERE numero_guia_acolhimento IS NOT NULL;

-- =====================================================
-- 3. Grupo familiar no acolhido (agrupamento manual)
-- =====================================================
ALTER TABLE acolhidos
  ADD COLUMN IF NOT EXISTS grupo_familiar TEXT;

COMMENT ON COLUMN acolhidos.grupo_familiar IS 'Identificador de grupo familiar (ex.: "G01", "Família Silva") — para agrupar irmãos nos relatórios';

CREATE INDEX IF NOT EXISTS acolhidos_grupo_familiar_idx
  ON acolhidos (grupo_familiar)
  WHERE grupo_familiar IS NOT NULL;

-- =====================================================
-- 4. Novo tipo de unidade: CASA_PASSAGEM
-- =====================================================
ALTER TYPE tipo_acolhimento ADD VALUE IF NOT EXISTS 'CASA_PASSAGEM';

-- =====================================================
-- 5. Novo motivo de desacolhimento: EVASAO
-- =====================================================
ALTER TYPE motivo_desacolhimento ADD VALUE IF NOT EXISTS 'EVASAO';