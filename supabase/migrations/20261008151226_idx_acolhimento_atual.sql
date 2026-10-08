-- =====================================================
-- Índices de performance para listagem de acolhidos
-- =====================================================

-- 1. Busca do vínculo vaga ↔ acolhimento (LEFT JOIN em listarEmAcolhimento)
CREATE INDEX IF NOT EXISTS vagas_acolhimento_atual_idx
  ON vagas (acolhimento_atual_id)
  WHERE acolhimento_atual_id IS NOT NULL;

-- 2. Verificação de acolhimento ativo por acolhido (NOT EXISTS em listarSemAcolhimento)
CREATE INDEX IF NOT EXISTS acolhimentos_acolhido_ativo_idx
  ON acolhimentos (acolhido_id)
  WHERE ativo = true;