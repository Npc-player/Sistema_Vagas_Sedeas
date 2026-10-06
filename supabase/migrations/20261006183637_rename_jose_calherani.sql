-- =====================================================
-- Renomeia o valor do enum tipo_acolhimento
-- JOSE_CALHERANI → SAI
-- =====================================================
-- ALTER TYPE ... RENAME VALUE é atômico e preserva os dados
-- existentes. Todas as linhas que tinham 'JOSE_CALHERANI'
-- passam automaticamente a ter 'SAI'.
-- =====================================================

ALTER TYPE tipo_acolhimento RENAME VALUE 'JOSE_CALHERANI' TO 'SAI';