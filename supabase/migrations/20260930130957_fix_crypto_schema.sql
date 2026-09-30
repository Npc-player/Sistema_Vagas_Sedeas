-- =====================================================
-- Corrige funções de criptografia para usar pgcrypto
-- do schema "extensions" (não do "public").
--
-- Motivo: Supabase instala o pgcrypto em "extensions".
-- Como nossas funções usam SET search_path = '', precisamos
-- qualificar explicitamente todas as chamadas.
-- =====================================================

-- 1. Recria encrypt_text com extensões qualificadas
CREATE OR REPLACE FUNCTION private.encrypt_text(
  plaintext TEXT,
  secret TEXT
) RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_encrypt(plaintext, secret, 'cipher-algo=aes256');
END;
$$;

-- 2. Recria decrypt_text com extensões qualificadas
CREATE OR REPLACE FUNCTION private.decrypt_text(
  ciphertext BYTEA,
  secret TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN extensions.pgp_sym_decrypt(ciphertext, secret);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 3. Reforça permissões (recriadas pelas funções)
REVOKE EXECUTE ON FUNCTION private.encrypt_text(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.decrypt_text(BYTEA, TEXT) FROM PUBLIC, anon, authenticated;