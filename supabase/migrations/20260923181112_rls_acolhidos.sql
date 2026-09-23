-- =====================================================
-- POLÍTICAS RLS: tabela acolhidos
-- Regra: acolhidos são visíveis apenas para quem tem vínculo
-- ativo com a unidade onde eles estão alocados.
-- =====================================================

-- Admin municipal: acesso total
DROP POLICY IF EXISTS acolhidos_admin_all ON acolhidos;
CREATE POLICY acolhidos_admin_all ON acolhidos
  FOR ALL USING ((SELECT private.user_role()) = 'ADMIN_MUNICIPAL');

-- Gestor / Operador: acesso aos acolhidos vinculados à sua unidade
DROP POLICY IF EXISTS acolhidos_gestor_unidade ON acolhidos;
CREATE POLICY acolhidos_gestor_unidade ON acolhidos
  FOR ALL USING (
    (SELECT private.user_role()) IN ('GESTOR_ACOLHIMENTO', 'OPERADOR')
    AND EXISTS (
      SELECT 1
      FROM public.acolhimentos a
      WHERE a.acolhido_id = acolhidos.id
        AND a.unidade_id = (SELECT private.user_unidade_id())
    )
  );
  