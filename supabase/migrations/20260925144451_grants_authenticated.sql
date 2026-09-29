-- =====================================================
-- GRANTs para a role `authenticated` (usuários logados)
-- =====================================================
-- As policies RLS controlam QUAIS linhas cada usuário vê.
-- Os GRANTs controlam SE o role pode executar a operação
-- na tabela. Ambos são necessários.
--
-- A role `anon` (visitantes não autenticados) NÃO recebe
-- nenhum GRANT — sem login, sem acesso a nada.
--
-- A role `service_role` já tem acesso total por padrão do
-- Supabase (bypassa RLS) e é usada apenas server-side.
-- =====================================================

-- Uso do schema public (sem isso, GRANTs em tabela não funcionam)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Tabelas operacionais: leitura e escrita (RLS filtra as linhas)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acolhidos     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acolhimentos  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas         TO authenticated;

-- Audit log: apenas INSERT e SELECT.
-- UPDATE e DELETE são bloqueados por trigger (LGPD Art. 37).
GRANT SELECT, INSERT ON public.audit_log TO authenticated;

-- =====================================================
-- BLOQUEIO EXPLÍCITO: role `anon` não acessa nada
-- =====================================================
-- Garante que mesmo se alguém conceder por engano no futuro,
-- o estado atual é "sem acesso".
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;