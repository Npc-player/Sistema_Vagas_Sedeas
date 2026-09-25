-- =====================================================
-- TRIGGER: criar profile automaticamente ao criar user
-- =====================================================
-- Quando um usuário é criado em auth.users (via Admin API),
-- este trigger insere automaticamente uma linha em public.profiles.
--
-- Metadados esperados em raw_user_meta_data:
--   - nome_completo (string, obrigatório)
--   - role (user_role, opcional — default: OPERADOR)
--   - unidade_id (uuid, opcional)
--
-- PRINCÍPIO DO MENOR PRIVILÉGIO:
-- Se o admin não informar a role, o usuário é criado como OPERADOR.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
  v_nome_completo text;
  v_unidade_id uuid;
BEGIN
  -- Extrai nome completo dos metadados (obrigatório)
  v_nome_completo := COALESCE(
    NEW.raw_user_meta_data->>'nome_completo',
    split_part(NEW.email, '@', 1)
  );

  -- Extrai role dos metadados, validando contra o enum
  -- Se inválida ou ausente, usa OPERADOR (menor privilégio)
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'OPERADOR'::public.user_role
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'OPERADOR'::public.user_role;
  END;

  -- Extrai unidade_id (opcional)
  BEGIN
    v_unidade_id := NULLIF(NEW.raw_user_meta_data->>'unidade_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_unidade_id := NULL;
  END;

  INSERT INTO public.profiles (
    id,
    nome_completo,
    role,
    unidade_id,
    ativo
  ) VALUES (
    NEW.id,
    v_nome_completo,
    v_role,
    v_unidade_id,
    TRUE
  );

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotência)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();