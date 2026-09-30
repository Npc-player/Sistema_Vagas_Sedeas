-- =====================================================
-- UNIQUE CONSTRAINT em cpf_hash
-- =====================================================
-- Defesa em profundidade (RN-03): garante que dois acolhidos
-- não possam compartilhar o mesmo CPF, mesmo que a validação
-- da aplicação falhe.
--
-- A constraint é parcial: só se aplica quando cpf_hash IS NOT NULL.
-- Isso permite múltiplos acolhidos sem CPF informado (ex.: recém-nascidos
-- ou situações em que o documento ainda não foi localizado).
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS acolhidos_cpf_hash_unique
  ON acolhidos (cpf_hash)
  WHERE cpf_hash IS NOT NULL;