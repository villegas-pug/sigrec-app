-- SPEC 040. Limpieza de los datos de demostración que las antiguas clases *DemoImport cargaron en Oracle.
--
-- ADVERTENCIA: este script BORRA TODOS los datos operativos de SIGREC (centros, módulos, ambientes, elementos, bienes,
-- eventos, servicios, vehículos, itinerarios, combustible, fotos, intervenciones, mantenimientos y precios), no solo los
-- de demostración. Úselo únicamente en un esquema que todavía no tenga datos reales.
--
-- CONSERVA: SGR_CATALOGO (incluidos los tipos de bien), SGR_PERFIL, SGR_PERMISO, SGR_PERFIL_PERMISO, el actor técnico
-- SIGREC_TECNICO y los usuarios creados desde la intranet (proveedor INTRANET).
--
-- Modo de uso:
--   1. Conéctese al esquema de SIGREC con un usuario con permiso de DELETE y revise el bloque «Conteos previos».
--   2. Ejecute el script completo. NO hace COMMIT: revise los «Conteos posteriores».
--   3. Si todo es correcto, ejecute COMMIT; si no, ROLLBACK.
--
-- No usa TRUNCATE ni desactiva restricciones: borra en orden de dependencia (hijas primero).

-- ---------------------------------------------------------------------------------------------------------------------
-- Conteos previos
-- ---------------------------------------------------------------------------------------------------------------------
SELECT 'SGR_CENTRO' tabla, COUNT(*) filas FROM SGR_CENTRO
UNION ALL SELECT 'SGR_BIEN', COUNT(*) FROM SGR_BIEN
UNION ALL SELECT 'SGR_INCIDENTE', COUNT(*) FROM SGR_INCIDENTE
UNION ALL SELECT 'SGR_SERVICIO', COUNT(*) FROM SGR_SERVICIO
UNION ALL SELECT 'SGR_VEHICULO', COUNT(*) FROM SGR_VEHICULO
UNION ALL SELECT 'SGR_PRECIO', COUNT(*) FROM SGR_PRECIO
UNION ALL SELECT 'SGR_USUARIO demo.%', COUNT(*) FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%';

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Datos operativos, de las tablas hijas a las padres
-- ---------------------------------------------------------------------------------------------------------------------
DELETE FROM SGR_BIEN_IMPLICADO;
DELETE FROM SGR_ATENCION;

-- El historial se refiere a sí mismo (traslado enlazado): se rompe el vínculo antes de borrar.
UPDATE SGR_HISTORIAL_BIEN SET ID_TRASLADO = NULL WHERE ID_TRASLADO IS NOT NULL;
DELETE FROM SGR_HISTORIAL_BIEN;

DELETE FROM SGR_REPOSICION;
DELETE FROM SGR_BAJA;
DELETE FROM SGR_INCIDENTE;

DELETE FROM SGR_FOTO;
DELETE FROM SGR_MANTENIMIENTO;
DELETE FROM SGR_INTERVENCION;

DELETE FROM SGR_COMBUSTIBLE;
DELETE FROM SGR_ITINERARIO;

DELETE FROM SGR_HECHO;
DELETE FROM SGR_PERIODO;
DELETE FROM SGR_SERVICIO;

DELETE FROM SGR_INVENTARIO_PREVIO;

-- Un bien puede ser componente de otro: se rompe el vínculo antes de borrar.
UPDATE SGR_BIEN SET ID_PRINCIPAL_BIEN = NULL WHERE ID_PRINCIPAL_BIEN IS NOT NULL;
DELETE FROM SGR_BIEN;

DELETE FROM SGR_ELEMENTO;
DELETE FROM SGR_VEHICULO;
DELETE FROM SGR_AMBIENTE;
DELETE FROM SGR_MODULO;
DELETE FROM SGR_CENTRO;

-- Los precios dependen de los tipos de bien (que se conservan) y de usuarios; no hay precios reales que preservar.
DELETE FROM SGR_PRECIO;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Cuentas de demostración (demo.central, demo.car, demo.verifica, demo.chofer)
-- ---------------------------------------------------------------------------------------------------------------------
-- Las tablas de configuración que se conservan pueden citar a esos usuarios como autores; se reasignan al actor técnico.
UPDATE SGR_CATALOGO SET USU_REGISTRA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_REGISTRA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_CATALOGO SET USU_ACTUALIZA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ACTUALIZA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_CATALOGO SET USU_ELIMINA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ELIMINA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

UPDATE SGR_PERFIL SET USU_REGISTRA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_REGISTRA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERFIL SET USU_ACTUALIZA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ACTUALIZA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERFIL SET USU_ELIMINA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ELIMINA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

UPDATE SGR_PERMISO SET USU_REGISTRA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_REGISTRA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERMISO SET USU_ACTUALIZA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ACTUALIZA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERMISO SET USU_ELIMINA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ELIMINA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

UPDATE SGR_PERFIL_PERMISO SET USU_REGISTRA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_REGISTRA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERFIL_PERMISO SET USU_ACTUALIZA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ACTUALIZA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_PERFIL_PERMISO SET USU_ELIMINA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_ELIMINA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

-- Asignaciones de perfil de esas cuentas.
DELETE FROM SGR_USUARIO_PERFIL WHERE ID_USUARIO IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

-- Sesiones del esquema anterior (la tabla puede no existir si nunca se creó).
BEGIN
  EXECUTE IMMEDIATE 'DELETE FROM SGR_SESION WHERE ID_USUARIO IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE ''demo.%'')';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

-- Los usuarios que aún figuren como autores de otros usuarios se reasignan al actor técnico antes de borrarlos.
UPDATE SGR_USUARIO SET USU_REGISTRA = (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO')
 WHERE USU_REGISTRA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%') AND CODIGO NOT LIKE 'demo.%';
UPDATE SGR_USUARIO SET USU_ACTUALIZA = NULL
 WHERE USU_ACTUALIZA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');
UPDATE SGR_USUARIO SET USU_ELIMINA = NULL
 WHERE USU_ELIMINA IN (SELECT ID FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%');

DELETE FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%';

-- ---------------------------------------------------------------------------------------------------------------------
-- Conteos posteriores: deben ser 0, salvo SGR_USUARIO demo.% = 0 y los catálogos intactos.
-- ---------------------------------------------------------------------------------------------------------------------
SELECT 'SGR_CENTRO' tabla, COUNT(*) filas FROM SGR_CENTRO
UNION ALL SELECT 'SGR_BIEN', COUNT(*) FROM SGR_BIEN
UNION ALL SELECT 'SGR_INCIDENTE', COUNT(*) FROM SGR_INCIDENTE
UNION ALL SELECT 'SGR_SERVICIO', COUNT(*) FROM SGR_SERVICIO
UNION ALL SELECT 'SGR_VEHICULO', COUNT(*) FROM SGR_VEHICULO
UNION ALL SELECT 'SGR_PRECIO', COUNT(*) FROM SGR_PRECIO
UNION ALL SELECT 'SGR_USUARIO demo.%', COUNT(*) FROM SGR_USUARIO WHERE CODIGO LIKE 'demo.%'
UNION ALL SELECT 'SGR_CATALOGO (se conserva)', COUNT(*) FROM SGR_CATALOGO
UNION ALL SELECT 'SGR_USUARIO SIGREC_TECNICO (se conserva)', COUNT(*) FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO';

-- COMMIT;   -- Ejecútelo solo después de revisar los conteos.
-- ROLLBACK; -- Úselo si algo no coincide.
