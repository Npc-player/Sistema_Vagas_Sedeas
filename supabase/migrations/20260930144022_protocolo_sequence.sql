-- =====================================================
-- SEQUENCE de protocolo de acolhimento
-- =====================================================
-- Gera números sequenciais únicos para protocolos no formato:
--   ACO-<ANO>-<NUMERO_COM_6_DIGITOS>
-- Exemplo: ACO-2026-000001
--
-- Uma SEQUENCE do PostgreSQL é atômica e à prova de concorrência:
-- mesmo com múltiplas admissões simultâneas, cada protocolo recebe
-- um número único.
-- =====================================================

-- Sequence global (não reinicia por ano — o ano é parte do formato visual)
CREATE SEQUENCE IF NOT EXISTS acolhimento_protocolo_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

-- =====================================================
-- Função que gera o próximo protocolo
-- =====================================================
CREATE OR REPLACE FUNCTION private.gerar_protocolo_acolhimento()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    'ACO-' ||
    TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('public.acolhimento_protocolo_seq')::text, 6, '0');
$$;

-- Apenas o backend (Drizzle, role postgres) pode chamar
REVOKE EXECUTE ON FUNCTION private.gerar_protocolo_acolhimento() FROM PUBLIC, anon, authenticated;