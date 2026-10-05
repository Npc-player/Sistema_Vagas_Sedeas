-- =====================================================
-- ATUALIZA TRIGGER: criação de profile a partir de auth.users
-- =====================================================
-- Agora inclui o campo prontuario nos metadados.
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
  v_prontuario text;
BEGIN
  v_nome_completo := COALESCE(
    NEW.raw_user_meta_data->>'nome_completo',
    split_part(NEW.email, '@', 1)
  );

  v_prontuario := NULLIF(NEW.raw_user_meta_data->>'prontuario', '');

  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'OPERADOR'::public.user_role
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'OPERADOR'::public.user_role;
  END;

  BEGIN
    v_unidade_id := NULLIF(NEW.raw_user_meta_data->>'unidade_id', '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_unidade_id := NULL;
  END;

  INSERT INTO public.profiles (
    id,
    nome_completo,
    prontuario,
    role,
    unidade_id,
    ativo
  ) VALUES (
    NEW.id,
    v_nome_completo,
    v_prontuario,
    v_role,
    v_unidade_id,
    TRUE
  );

  RETURN NEW;
END;
$$;