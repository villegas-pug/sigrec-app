-- SPEC 048. Aplicar antes de desplegar el backend.
-- El esquema puede no tener la restricción anterior; DDL de Oracle confirma implícitamente.
-- La nueva restricción se valida antes de retirar la anterior.
WHENEVER SQLERROR EXIT SQL.SQLCODE
DECLARE
    existentes NUMBER;
    condicion VARCHAR2(4000);
BEGIN
    SELECT COUNT(*) INTO existentes FROM USER_CONSTRAINTS
    WHERE TABLE_NAME = 'SGR_CENTRO' AND CONSTRAINT_NAME = 'CK_CTR_CEN_CODIGO_ALFANUM';
    IF existentes = 0 THEN
        EXECUTE IMMEDIATE q'[ALTER TABLE SGR_CENTRO ADD CONSTRAINT CK_CTR_CEN_CODIGO_ALFANUM CHECK (REGEXP_LIKE(CODIGO, '^[A-Z0-9]{3}$', 'c'))]';
    ELSE
        SELECT SEARCH_CONDITION_VC INTO condicion FROM USER_CONSTRAINTS
        WHERE TABLE_NAME = 'SGR_CENTRO' AND CONSTRAINT_NAME = 'CK_CTR_CEN_CODIGO_ALFANUM';
        IF REPLACE(REPLACE(UPPER(condicion), ' ', ''), '"', '') != q'[REGEXP_LIKE(CODIGO,'^[A-Z0-9]{3}$','C')]' THEN
            RAISE_APPLICATION_ERROR(-20048, 'La restricción alfanumérica existente tiene otra definición; revisar antes de continuar.');
        END IF;
        EXECUTE IMMEDIATE 'ALTER TABLE SGR_CENTRO ENABLE VALIDATE CONSTRAINT CK_CTR_CEN_CODIGO_ALFANUM';
    END IF;
END;
/

DECLARE
    existentes NUMBER;
BEGIN
    SELECT COUNT(*) INTO existentes FROM USER_CONSTRAINTS
    WHERE TABLE_NAME = 'SGR_CENTRO' AND CONSTRAINT_NAME = 'CK_CTR_CEN_CODIGO';
    IF existentes > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE SGR_CENTRO DROP CONSTRAINT CK_CTR_CEN_CODIGO';
    END IF;
END;
/
