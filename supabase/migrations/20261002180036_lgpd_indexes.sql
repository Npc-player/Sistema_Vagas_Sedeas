-- =====================================================
-- Índices para lgpd_requisicoes
-- =====================================================
-- Otimiza a listagem com ordenação por status + data.
-- Também simplificamos a ordenação para permitir uso de índice.
-- =====================================================

-- Índice composto para ordenação por data (mais usado)
CREATE INDEX IF NOT EXISTS lgpd_requisicoes_created_desc_idx
  ON lgpd_requisicoes (created_at DESC);

-- Índice para filtro por status
CREATE INDEX IF NOT EXISTS lgpd_requisicoes_status_idx
  ON lgpd_requisicoes (status);

-- Índice composto (status + data) para o painel ordenado
CREATE INDEX IF NOT EXISTS lgpd_requisicoes_status_created_idx
  ON lgpd_requisicoes (status, created_at DESC);

-- Índice no prazo (para alertas de vencimento)
CREATE INDEX IF NOT EXISTS lgpd_requisicoes_prazo_idx
  ON lgpd_requisicoes (prazo_resposta)
  WHERE prazo_resposta IS NOT NULL;