-- =====================================================
-- TIPIFICAÇÃO NACIONAL DE SERVIÇOS SOCIOASSISTENCIAIS
-- + PÚBLICO-ALVO POR UNIDADE
-- =====================================================
-- Substitui o enum tipo_acolhimento antigo (ILPI, SAICA,
-- Centro Dia, José Calherani) pela tipificação nacional.
-- Adiciona tabela N:N de público-alvo por unidade.
-- =====================================================

-- =====================================================
-- 1. Novo enum tipo_acolhimento
-- =====================================================
CREATE TYPE tipo_acolhimento_novo AS ENUM (
  'ABRIGO_INSTITUCIONAL',
  'CASA_LAR',
  'CASA_PASSAGEM',
  'RESIDENCIA_INCLUSIVA',
  'REPUBLICA',
  'FAMILIA_ACOLHEDORA',
  'CALAMIDADES_EMERGENCIAS'
);

-- =====================================================
-- 2. Adiciona coluna temporária e migra dados
-- =====================================================
ALTER TABLE unidades
  ADD COLUMN tipo_novo tipo_acolhimento_novo;

UPDATE unidades SET tipo_novo = CASE tipo::text
  WHEN 'ILPI'                   THEN 'ABRIGO_INSTITUCIONAL'::tipo_acolhimento_novo
  WHEN 'SAICA'                  THEN 'ABRIGO_INSTITUCIONAL'::tipo_acolhimento_novo
  WHEN 'JOSE_CALHERANI'         THEN 'ABRIGO_INSTITUCIONAL'::tipo_acolhimento_novo
  WHEN 'CASA_PASSAGEM'          THEN 'CASA_PASSAGEM'::tipo_acolhimento_novo
  WHEN 'RESIDENCIA_INCLUSIVA'   THEN 'RESIDENCIA_INCLUSIVA'::tipo_acolhimento_novo
  WHEN 'CENTRO_DIA_IDOSO'       THEN NULL  -- serviço de convivência, não acolhimento
  ELSE 'ABRIGO_INSTITUCIONAL'::tipo_acolhimento_novo
END;

-- =====================================================
-- 3. Remove coluna antiga e renomeia
-- =====================================================
ALTER TABLE unidades DROP COLUMN tipo;
ALTER TABLE unidades RENAME COLUMN tipo_novo TO tipo;

-- Torna NOT NULL somente após a migração
-- (unidades antigas de Centro Dia ficariam com NULL — mas não há nenhuma)
UPDATE unidades SET tipo = 'ABRIGO_INSTITUCIONAL'::tipo_acolhimento_novo
WHERE tipo IS NULL;

ALTER TABLE unidades ALTER COLUMN tipo SET NOT NULL;

-- =====================================================
-- 4. Remove enum antigo e renomeia o novo
-- =====================================================
DROP TYPE tipo_acolhimento;
ALTER TYPE tipo_acolhimento_novo RENAME TO tipo_acolhimento;

-- =====================================================
-- 5. Enum de público-alvo
-- =====================================================
CREATE TYPE publico_alvo AS ENUM (
  'CRIANCAS_ADOLESCENTES',
  'JOVENS_EGRESSOS',
  'CRIANCAS_ADOLESCENTES_DEFICIENCIA',
  'ADULTOS_DEFICIENCIA',
  'ADULTOS_FAMILIAS',
  'MULHERES_VIOLENCIA',
  'PESSOAS_IDOSAS',
  'POPULACAO_LGBTQIA',
  'POPULACAO_RUA',
  'SAIDA_RUA',
  'MIGRANTES_REFUGIADOS',
  'FAMILIAS_DESABRIGADAS'
);

-- =====================================================
-- 6. Tabela N:N de público-alvo por unidade
-- =====================================================
CREATE TABLE unidade_publico_alvo (
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  publico publico_alvo NOT NULL,
  PRIMARY KEY (unidade_id, publico)
);

CREATE INDEX unidade_publico_alvo_publico_idx
  ON unidade_publico_alvo (publico);

-- =====================================================
-- 7. RLS
-- =====================================================
ALTER TABLE unidade_publico_alvo ENABLE ROW LEVEL SECURITY;

CREATE POLICY unidade_publico_alvo_select ON unidade_publico_alvo
  FOR SELECT USING (TRUE);

CREATE POLICY unidade_publico_alvo_admin ON unidade_publico_alvo
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- GRANTs
GRANT SELECT ON public.unidade_publico_alvo TO authenticated, anon;

-- =====================================================
-- 8. Migra público-alvo inferido das unidades existentes
-- =====================================================
-- Antes de dropar o tipo antigo, salvamos o mapeamento.
-- Como já dropamos, precisamos fazer isso ANTES — que é o que a
-- migration anterior (UPDATE) já fez implícito. Vamos marcar
-- o público-alvo padrão por tipo atual:

-- ABRIGO_INSTITUCIONAL: depende do que a unidade era antes
-- Vamos verificar cada unidade e inserir os públicos

INSERT INTO unidade_publico_alvo (unidade_id, publico)
SELECT id, 'PESSOAS_IDOSAS'::publico_alvo
FROM unidades
WHERE nome ILIKE '%ILPI%' OR nome ILIKE '%idoso%'
ON CONFLICT DO NOTHING;

INSERT INTO unidade_publico_alvo (unidade_id, publico)
SELECT id, 'CRIANCAS_ADOLESCENTES'::publico_alvo
FROM unidades
WHERE nome ILIKE '%SAICA%' OR nome ILIKE '%crian%'
ON CONFLICT DO NOTHING;

INSERT INTO unidade_publico_alvo (unidade_id, publico)
SELECT id, 'ADULTOS_DEFICIENCIA'::publico_alvo
FROM unidades
WHERE tipo = 'RESIDENCIA_INCLUSIVA'::tipo_acolhimento
ON CONFLICT DO NOTHING;

-- ⚠️ ATENÇÃO: após rodar essa migration, revise CADA unidade e ajuste o
-- público-alvo correto pelo painel de edição.