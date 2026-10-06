-- =====================================================
-- Adiciona psicólogo do CREAS na equipe técnica
-- =====================================================

ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS psic_creas TEXT;

COMMENT ON COLUMN unidades.psic_creas IS 'Psicólogo(a) de referência do CREAS';

-- Também adiciona o campo por acolhimento (override)
ALTER TABLE acolhimentos
  ADD COLUMN IF NOT EXISTS psic_creas TEXT;

COMMENT ON COLUMN acolhimentos.psic_creas IS 'Psicólogo(a) do CREAS para este acolhimento (override da unidade)';