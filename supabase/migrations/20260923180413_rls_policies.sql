-- =====================================================
-- 0. Criar schema privado para funções helper
-- =====================================================
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- =====================================================
-- 1. Habilitar RLS em TODAS as tabelas
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE acolhidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acolhimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Funções helper (DROP antes de recriar)
-- =====================================================
DROP FUNCTION IF EXISTS private.user_role() CASCADE;
DROP FUNCTION IF EXISTS private.user_unidade_id() CASCADE;

CREATE FUNCTION private.user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '';

CREATE FUNCTION private.user_unidade_id() RETURNS UUID AS $$
  SELECT unidade_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '';

REVOKE EXECUTE ON FUNCTION private.user_role() FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.user_unidade_id() FROM PUBLIC, anon, authenticated, service_role;

-- =====================================================
-- 3. POLÍTICAS: profiles
-- =====================================================
DROP POLICY IF EXISTS profiles_self_read ON profiles;
DROP POLICY IF EXISTS profiles_admin_all ON profiles;

CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- =====================================================
-- 4. POLÍTICAS: unidades
-- =====================================================
DROP POLICY IF EXISTS unidades_admin_all ON unidades;
DROP POLICY IF EXISTS unidades_gestor_read ON unidades;
DROP POLICY IF EXISTS unidades_conselho_read ON unidades;

CREATE POLICY unidades_admin_all ON unidades
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

CREATE POLICY unidades_gestor_read ON unidades
  FOR SELECT USING (
    (SELECT private.user_role()) IN ('GESTOR_ACOLHIMENTO', 'OPERADOR')
    AND id = (SELECT private.user_unidade_id())
  );

CREATE POLICY unidades_conselho_read ON unidades
  FOR SELECT USING (
    (SELECT private.user_role()) IN ('CONSELHO_MUNICIPAL', 'JUDICIARIO_MP')
  );

-- =====================================================
-- 5. POLÍTICAS: acolhimentos
-- =====================================================
DROP POLICY IF EXISTS acolhimentos_admin_all ON acolhimentos;
DROP POLICY IF EXISTS acolhimentos_gestor_unidade ON acolhimentos;

CREATE POLICY acolhimentos_admin_all ON acolhimentos
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

CREATE POLICY acolhimentos_gestor_unidade ON acolhimentos
  FOR ALL USING (
    (SELECT private.user_role()) IN ('GESTOR_ACOLHIMENTO', 'OPERADOR')
    AND unidade_id = (SELECT private.user_unidade_id())
  );

-- =====================================================
-- 6. POLÍTICAS: vagas
-- =====================================================
DROP POLICY IF EXISTS vagas_admin_all ON vagas;
DROP POLICY IF EXISTS vagas_gestor_unidade ON vagas;

CREATE POLICY vagas_admin_all ON vagas
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

CREATE POLICY vagas_gestor_unidade ON vagas
  FOR ALL USING (
    (SELECT private.user_role()) IN ('GESTOR_ACOLHIMENTO', 'OPERADOR')
    AND unidade_id = (SELECT private.user_unidade_id())
  );

-- =====================================================
-- 7. POLÍTICAS: audit_log
-- =====================================================
DROP POLICY IF EXISTS audit_insert ON audit_log;
DROP POLICY IF EXISTS audit_read_admin ON audit_log;

CREATE POLICY audit_insert ON audit_log
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY audit_read_admin ON audit_log
  FOR SELECT USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- =====================================================
-- 8. Bloquear UPDATE/DELETE no audit_log
-- =====================================================
DROP TRIGGER IF EXISTS audit_no_update ON audit_log;
DROP TRIGGER IF EXISTS audit_no_delete ON audit_log;

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log é imutável (LGPD Art. 37)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();