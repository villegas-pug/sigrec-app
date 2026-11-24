-- =============================================================
-- Archivo   : sigrec/dml/003_elementos_infraestructura_por_ficha_update.sql
-- Propósito : SPEC 051 (elementos de infraestructura por ficha).
--             Convierte las evaluaciones base de SGR_ELEMENTO en
--             elementos propios (NOMBRE + ICONO) y reemplaza las
--             restricciones CHECK antiguas por SGR_CK_ELEMENTO_OBJ.
-- Orden     : 1) Iniciar el backend con SIGREC_DDL_AUTO=update para que
--                Hibernate cree la columna ICONO y detenerlo.
--             2) Ejecutar este script (Run Script / F5) como USRSEGURIDAD.
--             3) Iniciar el backend sin la variable (ddl-auto=validate).
-- Idempotente: si ICONO ya existe (creada por Hibernate) no la vuelve a
--             crear; si no hay filas con ID_ELEMENTO_BASE, el UPDATE no
--             modifica datos.
-- Nota      : Oracle confirma implícitamente los cambios DDL. Se
--             recomienda antes: CREATE TABLE SGR_ELEMENTO_BK051 AS
--             SELECT * FROM SGR_ELEMENTO;
-- =============================================================
WHENEVER SQLERROR EXIT SQL.SQLCODE

-- 1) Los nombres de elementos base deben caber en NOMBRE (40).
DECLARE
  nombres_largos NUMBER;
BEGIN
  SELECT COUNT(*) INTO nombres_largos FROM SGR_ELEMENTO e
  JOIN SGR_CATALOGO c ON c.ID = e.ID_ELEMENTO_BASE WHERE LENGTH(c.NOMBRE) > 40;
  IF nombres_largos > 0 THEN
    RAISE_APPLICATION_ERROR(-20051, 'Hay nombres de elementos base con más de 40 caracteres; resolver antes de migrar.');
  END IF;
END;
/

-- 2) Crea ICONO solo si Hibernate no la creó antes.
DECLARE
  existe NUMBER;
BEGIN
  SELECT COUNT(*) INTO existe FROM USER_TAB_COLUMNS
  WHERE TABLE_NAME = 'SGR_ELEMENTO' AND COLUMN_NAME = 'ICONO';
  IF existe = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE SGR_ELEMENTO ADD (ICONO VARCHAR2(60 CHAR))';
  END IF;
END;
/

-- 3) Elimina las restricciones CHECK antiguas (nombres de Hibernate o del modelo ER).
BEGIN
  FOR c IN (SELECT constraint_name FROM user_constraints
            WHERE table_name = 'SGR_ELEMENTO' AND constraint_name IN
              ('SGR_CK_ELEMENTO_OBJ', 'CK_CTR_ELE_TIPO', 'CK_CTR_ELE_BASE_AMB', 'CK_CTR_ELE_BASE_COND')) LOOP
    EXECUTE IMMEDIATE 'ALTER TABLE SGR_ELEMENTO DROP CONSTRAINT ' || DBMS_ASSERT.SIMPLE_SQL_NAME(c.constraint_name);
  END LOOP;
END;
/

-- 4) La clave y la condición permanecen intactas, incluso en filas históricas.
UPDATE SGR_ELEMENTO e
SET NOMBRE = (SELECT c.NOMBRE FROM SGR_CATALOGO c WHERE c.ID = e.ID_ELEMENTO_BASE),
    ICONO = CASE LOWER((SELECT c.CODIGO FROM SGR_CATALOGO c WHERE c.ID = e.ID_ELEMENTO_BASE))
      WHEN 'puertas' THEN 'door_front' WHEN 'ventanas' THEN 'window'
      WHEN 'pintura' THEN 'format_paint' WHEN 'pisos' THEN 'grid_on'
      WHEN 'techo' THEN 'roofing' WHEN 'estructura' THEN 'foundation'
      WHEN 'instalaciones_electricas' THEN 'electrical_services'
      WHEN 'instalaciones_sanitarias' THEN 'plumbing' ELSE 'category' END,
    ID_ELEMENTO_BASE = NULL
WHERE e.ID_ELEMENTO_BASE IS NOT NULL;

UPDATE SGR_ELEMENTO SET ICONO = 'category' WHERE ICONO IS NULL;
COMMIT;

-- 5) Nueva restricción: un solo objeto dueño, nombre obligatorio y sin elemento base.
ALTER TABLE SGR_ELEMENTO ADD CONSTRAINT SGR_CK_ELEMENTO_OBJ CHECK (
  (CASE WHEN ID_CENTRO IS NULL THEN 0 ELSE 1 END + CASE WHEN ID_MODULO IS NULL THEN 0 ELSE 1 END +
   CASE WHEN ID_AMBIENTE IS NULL THEN 0 ELSE 1 END) = 1 AND NOMBRE IS NOT NULL AND ID_ELEMENTO_BASE IS NULL
);
