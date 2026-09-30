-- =====================================================
-- FUNÇÕES DE CRIPTOGRAFIA (LGPD Art. 11)
-- =====================================================
-- Criptografia simétrica AES-256 via pgcrypto.
-- O segredo (chave) NÃO fica no banco — é passado em cada
-- chamada pela aplicação a partir de FIELD_ENCRYPTION_KEY.
--
-- Isso garante que mesmo um dump do banco não exponha os dados:
-- sem a chave, os campos criptografados são ilegíveis.
-- =====================================================

-- =====================================================
-- 1. Criptografar texto → bytea
-- =====================================================
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
  RETURN pgp_sym_encrypt(plaintext, secret, 'cipher-algo=aes256');
END;
$$;

-- =====================================================
-- 2. Descriptografar bytea → texto
-- =====================================================
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
  RETURN pgp_sym_decrypt(ciphertext, secret);
EXCEPTION
  WHEN OTHERS THEN
    -- Chave errada ou dado corrompido → retorna NULL em vez de estourar erro
    RETURN NULL;
END;
$$;

-- =====================================================
-- 3. Gerar HMAC para busca (hash determinístico)
-- =====================================================
-- O HMAC permite busca por igualdade (ex.: "encontre o acolhido
-- com este CPF") sem precisar descriptografar todas as linhas.
--
-- IMPORTANTE: usar chave diferente da criptografia simétrica,
-- para que um vazamento do hash não comprometa a criptografia.
-- Por simplicidade, usamos a mesma chave com prefixo "hmac:" —
-- em produção, prefira chaves separadas.
-- =====================================================
CREATE OR REPLACE FUNCTION private.hmac_value(
  value TEXT,
  secret TEXT
) RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
IMMUTABLE
AS $$
  SELECT encode(
    extensions.hmac(value::bytea, ('hmac:' || secret)::bytea, 'sha256'),
    'hex'
  );
$$;

-- =====================================================
-- 4. Permissões
-- =====================================================
-- As funções são chamadas pelo Drizzle (role postgres),
-- que já tem acesso total. Revogamos o acesso de anon
-- e authenticated para ninguém poder chamá-las direto via API.
REVOKE EXECUTE ON FUNCTION private.encrypt_text(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.decrypt_text(BYTEA, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.hmac_value(TEXT, TEXT) FROM PUBLIC, anon, authenticated;