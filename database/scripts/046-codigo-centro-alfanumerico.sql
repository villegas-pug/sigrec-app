-- SPEC 048. Aplicar antes de desplegar el backend.
-- Agregar primero la nueva validación mantiene activa la restricción anterior si la validación falla.
ALTER TABLE SGR_CENTRO ADD CONSTRAINT CK_CTR_CEN_CODIGO_ALFANUM
    CHECK (REGEXP_LIKE(CODIGO, '^[A-Z0-9]{3}$', 'c'));

ALTER TABLE SGR_CENTRO DROP CONSTRAINT CK_CTR_CEN_CODIGO;
