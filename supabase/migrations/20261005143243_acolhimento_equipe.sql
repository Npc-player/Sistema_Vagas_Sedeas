-- =====================================================
-- EQUIPE TÉCNICA POR ACOLHIMENTO
-- =====================================================
-- Permite que cada acolhimento tenha uma equipe técnica
-- específica (Assistente Social e Psicólogo da Vara da
-- Infância, Assistente Social do CREAS), que substitui
-- os valores padrão da unidade quando preenchida.
--
-- No formulário de admissão, os campos vêm pré-preenchidos
-- com os valores da unidade selecionada, mas podem ser
-- editados para cada caso específico.
--
-- Nos relatórios, se o campo do acolhimento estiver vazio,
-- usa-se o valor padrão da unidade como fallback.
-- =====================================================

ALTER TABLE acolhimentos
  ADD COLUMN IF NOT EXISTS as_vara_infancia TEXT,
  ADD COLUMN IF NOT EXISTS psic_vara_infancia TEXT,
  ADD COLUMN IF NOT EXISTS as_creas TEXT;

COMMENT ON COLUMN acolhimentos.as_vara_infancia IS 'Assistente Social da Vara da Infância para este acolhimento (override da unidade)';
COMMENT ON COLUMN acolhimentos.psic_vara_infancia IS 'Psicólogo(a) da Vara da Infância para este acolhimento (override da unidade)';
COMMENT ON COLUMN acolhimentos.as_creas IS 'Assistente Social do CREAS para este acolhimento (override da unidade)';