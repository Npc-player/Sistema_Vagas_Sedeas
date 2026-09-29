-- =====================================================
-- GRANTs para as funções helper do schema private
-- =====================================================
-- As funções private.user_role() e private.user_unidade_id()
-- são chamadas dentro das policies RLS. Para que o PostgreSQL
-- as avalie, o role `authenticated` precisa de EXECUTE.
--
-- A role `anon` continua bloqueada — visitantes não autenticados
-- não podem avaliar as policies (nem precisam, pois não têm acesso
-- a nenhuma tabela).
-- =====================================================

-- Uso do schema private
GRANT USAGE ON SCHEMA private TO authenticated;

-- EXECUTE nas funções helper
GRANT EXECUTE ON FUNCTION private.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_unidade_id() TO authenticated;

-- Reforço: anon continua sem acesso
REVOKE EXECUTE ON FUNCTION private.user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION private.user_unidade_id() FROM anon;
REVOKE USAGE ON SCHEMA private FROM anon;
