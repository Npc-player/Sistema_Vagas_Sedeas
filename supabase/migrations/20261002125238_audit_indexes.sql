-- =====================================================
-- Índices otimizados para audit_log
-- =====================================================
-- A tabela audit_log cresce indefinidamente (append-only).
-- O índice em created_at DESC é essencial para a listagem
-- paginada com ORDER BY created_at DESC.
--
-- Também criamos índices compostos para os filtros mais comuns:
--   - action + created_at
--   - entity + created_at
--   - user_id + created_at
-- =====================================================

-- 1. Índice primário para ordenação (DESC é o padrão da listagem)
CREATE INDEX IF NOT EXISTS audit_log_created_at_desc_idx
  ON audit_log (created_at DESC);

-- 2. Índices compostos para filtros combinados com ordenação
CREATE INDEX IF NOT EXISTS audit_log_action_created_idx
  ON audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_entity_created_idx
  ON audit_log (entity, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_user_created_idx
  ON audit_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;