-- =====================================================
-- ÍNDICES para as queries agregadas de fluxo
-- =====================================================
-- Otimiza a query de fluxo mensal (entradas/saídas por mês),
-- além dos filtros por unidade e situação especial.
-- =====================================================

-- Índice em data_acolhimento (para contagens de entrada por mês)
CREATE INDEX IF NOT EXISTS acolhimentos_data_acolhimento_idx
  ON acolhimentos (data_acolhimento);

-- Índice em data_desacolhimento (para contagens de saída por mês)
CREATE INDEX IF NOT EXISTS acolhimentos_data_desacolhimento_idx
  ON acolhimentos (data_desacolhimento)
  WHERE data_desacolhimento IS NOT NULL;

-- Índice composto (unidade + data de acolhimento) — muito usado com filtros
CREATE INDEX IF NOT EXISTS acolhimentos_unidade_data_idx
  ON acolhimentos (unidade_id, data_acolhimento);

-- Índice composto (unidade + situação especial)
CREATE INDEX IF NOT EXISTS acolhimentos_unidade_situacao_idx
  ON acolhimentos (unidade_id, situacao_especial)
  WHERE situacao_especial IS NOT NULL;

-- Índice em situação_especial_em (para período de evasão/outros)
CREATE INDEX IF NOT EXISTS acolhimentos_situacao_em_idx
  ON acolhimentos (situacao_especial_em)
  WHERE situacao_especial_em IS NOT NULL;

-- Índice em unidades.tipo (filtro frequente no dashboard e relatórios)
CREATE INDEX IF NOT EXISTS unidades_tipo_ativo_idx
  ON unidades (tipo)
  WHERE ativo = true;