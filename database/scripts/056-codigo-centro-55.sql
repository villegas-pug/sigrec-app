-- SPEC 056. Aplicar antes de desplegar el backend.
-- Amplía SGR_CENTRO.CODIGO de CHAR(3 CHAR) a VARCHAR2(55 CHAR) y ajusta la restricción alfanumérica a 1..55 caracteres.
-- Los códigos existentes (3 caracteres) cumplen la nueva regla; no requiere migrar datos.
WHENEVER SQLERROR EXIT SQL.SQLCODE

DECLARE
    existentes NUMBER;
BEGIN
    SELECT COUNT(*) INTO existentes FROM USER_CONSTRAINTS
    WHERE TABLE_NAME = 'SGR_CENTRO' AND CONSTRAINT_NAME = 'CK_CTR_CEN_CODIGO_ALFANUM';
    IF existentes > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE SGR_CENTRO DROP CONSTRAINT CK_CTR_CEN_CODIGO_ALFANUM';
    END IF;
END;
/

ALTER TABLE SGR_CENTRO MODIFY (CODIGO VARCHAR2(55 CHAR));

-- CODIGO admite NULL (Oracle permite varios NULL bajo SGR_UK_CENTRO_COD). ORA-01451 si ya es nulable, por eso se condiciona.
DECLARE
    obligatorio NUMBER;
BEGIN
    SELECT COUNT(*) INTO obligatorio FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'SGR_CENTRO' AND COLUMN_NAME = 'CODIGO' AND NULLABLE = 'N';
    IF obligatorio > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE SGR_CENTRO MODIFY (CODIGO NULL)';
    END IF;
END;
/

ALTER TABLE SGR_CENTRO ADD CONSTRAINT CK_CTR_CEN_CODIGO_ALFANUM
    CHECK (REGEXP_LIKE(CODIGO, '^[A-Z0-9]{1,55}$', 'c'));


-- ! COMMIT;