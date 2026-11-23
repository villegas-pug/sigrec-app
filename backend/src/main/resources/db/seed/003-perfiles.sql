-- SPEC 037. fuentes: perfiles.js, menu.js y routes.js. usuario.* corresponde a la gestión REST aprobada.
MERGE INTO SGR_PERFIL t
USING (
    SELECT 'CENTRAL' CODIGO, 'Equipo central USPNNA' NOMBRE FROM DUAL
    UNION ALL SELECT 'CAR', 'Personal del CAR' FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'Verificación física' FROM DUAL
    UNION ALL SELECT 'CHOFER', 'Chofer' FROM DUAL
) d
ON (t.CODIGO = d.CODIGO)
WHEN NOT MATCHED THEN INSERT (CODIGO, NOMBRE, ESTADO, ELIMINADO, USU_REGISTRA, FEC_REGISTRA)
VALUES (d.CODIGO, d.NOMBRE, 1, 0, (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO'), SYSDATE)
@@
MERGE INTO SGR_PERMISO t
USING (
    SELECT 'RUTA' TIPO, 'inicio' CODIGO, 'inicio' NOMBRE FROM DUAL
    UNION ALL SELECT 'RUTA', 'centros', 'centros' FROM DUAL
    UNION ALL SELECT 'RUTA', 'incidencias', 'incidencias' FROM DUAL
    UNION ALL SELECT 'RUTA', 'necesidades', 'necesidades' FROM DUAL
    UNION ALL SELECT 'RUTA', 'inventario', 'inventario' FROM DUAL
    UNION ALL SELECT 'RUTA', 'servicios', 'servicios' FROM DUAL
    UNION ALL SELECT 'RUTA', 'vehiculos', 'vehiculos' FROM DUAL
    UNION ALL SELECT 'RUTA', 'itinerarios', 'itinerarios' FROM DUAL
    UNION ALL SELECT 'RUTA', 'combustible', 'combustible' FROM DUAL
    UNION ALL SELECT 'RUTA', 'manual', 'manual' FROM DUAL
    UNION ALL SELECT 'RUTA', 'precios', 'precios' FROM DUAL
    UNION ALL SELECT 'ACCION', 'centro.incidente', 'centro.incidente' FROM DUAL
    UNION ALL SELECT 'ACCION', 'ambiente.incidente', 'ambiente.incidente' FROM DUAL
    UNION ALL SELECT 'ACCION', 'centro.actualizar', 'centro.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'centro.foto', 'centro.foto' FROM DUAL
    UNION ALL SELECT 'ACCION', 'foto.actualizar', 'foto.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'foto.anular', 'foto.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'modulo.registrar', 'modulo.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'modulo.actualizar', 'modulo.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'modulo.anular', 'modulo.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'ambiente.registrar', 'ambiente.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'ambiente.actualizar', 'ambiente.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'ambiente.anular', 'ambiente.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'novedad.registrar', 'novedad.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'novedad.actualizar', 'novedad.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'novedad.atender', 'novedad.atender' FROM DUAL
    UNION ALL SELECT 'ACCION', 'novedad.anular', 'novedad.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'intervencion.registrar', 'intervencion.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'intervencion.actualizar', 'intervencion.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'intervencion.anular', 'intervencion.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.registrar', 'bien.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.actualizar', 'bien.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.componente', 'bien.componente' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.trasladar', 'bien.trasladar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.anular', 'bien.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.verificar', 'bien.verificar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.incidente', 'bien.incidente' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.baja', 'bien.baja' FROM DUAL
    UNION ALL SELECT 'ACCION', 'bien.reposicion', 'bien.reposicion' FROM DUAL
    UNION ALL SELECT 'ACCION', 'incidente.actualizar', 'incidente.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'incidente.anular', 'incidente.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'servicio.registrar', 'servicio.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'servicio.actualizar', 'servicio.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'servicio.anular', 'servicio.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'servicio.periodo', 'servicio.periodo' FROM DUAL
    UNION ALL SELECT 'ACCION', 'hecho.registrar', 'hecho.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'hecho.actualizar', 'hecho.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'hecho.anular', 'hecho.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'vehiculo.registrar', 'vehiculo.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'vehiculo.actualizar', 'vehiculo.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'vehiculo.anular', 'vehiculo.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'itinerario.registrar', 'itinerario.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'itinerario.actualizar', 'itinerario.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'itinerario.ejecucion', 'itinerario.ejecucion' FROM DUAL
    UNION ALL SELECT 'ACCION', 'itinerario.anular', 'itinerario.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'combustible.informar', 'combustible.informar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'combustible.actualizar', 'combustible.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'combustible.anular', 'combustible.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'mantenimiento.registrar', 'mantenimiento.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'mantenimiento.actualizar', 'mantenimiento.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'mantenimiento.anular', 'mantenimiento.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'centro.registrar', 'centro.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'centro.anular', 'centro.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'baja.anular', 'baja.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'reposicion.anular', 'reposicion.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'tipoBien.registrar', 'tipoBien.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'tipoBien.actualizar', 'tipoBien.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'tipoBien.anular', 'tipoBien.anular' FROM DUAL
    UNION ALL SELECT 'ACCION', 'precio.informar', 'precio.informar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'combustible.actualizarPropio', 'combustible.actualizarPropio' FROM DUAL
    UNION ALL SELECT 'ACCION', 'usuario.consultar', 'usuario.consultar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'usuario.registrar', 'usuario.registrar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'usuario.actualizar', 'usuario.actualizar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'usuario.desactivar', 'usuario.desactivar' FROM DUAL
    UNION ALL SELECT 'ACCION', 'usuario.asignar', 'usuario.asignar' FROM DUAL
) d
ON (t.TIPO = d.TIPO AND t.CODIGO = d.CODIGO)
WHEN NOT MATCHED THEN INSERT (TIPO, CODIGO, NOMBRE, ESTADO, ELIMINADO, USU_REGISTRA, FEC_REGISTRA)
VALUES (d.TIPO, d.CODIGO, d.NOMBRE, 1, 0, (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO'), SYSDATE)
@@
MERGE INTO SGR_PERFIL_PERMISO t
USING (SELECT p.ID PERFIL, m.ID PERMISO, g.ORDEN FROM (
    SELECT 'CENTRAL' PERFIL, 'RUTA' TIPO, 'inicio' CODIGO, 1 ORDEN FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'centros', 2 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'incidencias', 3 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'necesidades', 4 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'inventario', 5 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'servicios', 6 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'vehiculos', 7 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'itinerarios', 8 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'combustible', 9 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'manual', 10 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'RUTA', 'precios', 11 FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'centro.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'ambiente.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'centro.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'centro.foto', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'foto.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'foto.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'modulo.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'modulo.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'modulo.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'ambiente.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'ambiente.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'ambiente.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'novedad.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'novedad.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'novedad.atender', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'novedad.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'intervencion.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'intervencion.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'intervencion.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.componente', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.trasladar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.verificar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.baja', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'bien.reposicion', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'incidente.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'incidente.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'servicio.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'servicio.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'servicio.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'servicio.periodo', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'hecho.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'hecho.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'hecho.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'vehiculo.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'vehiculo.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'vehiculo.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'itinerario.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'itinerario.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'itinerario.ejecucion', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'itinerario.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'combustible.informar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'combustible.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'combustible.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'mantenimiento.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'mantenimiento.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'mantenimiento.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'centro.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'centro.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'baja.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'reposicion.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'tipoBien.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'tipoBien.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'tipoBien.anular', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'precio.informar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'combustible.actualizarPropio', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'usuario.consultar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'usuario.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'usuario.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'usuario.desactivar', NULL FROM DUAL
    UNION ALL SELECT 'CENTRAL', 'ACCION', 'usuario.asignar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'inicio', 1 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'centros', 2 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'incidencias', 3 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'necesidades', 4 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'inventario', 5 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'servicios', 6 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'vehiculos', 7 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'itinerarios', 8 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'combustible', 9 FROM DUAL
    UNION ALL SELECT 'CAR', 'RUTA', 'manual', 10 FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'centro.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'ambiente.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'centro.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'centro.foto', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'foto.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'foto.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'modulo.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'modulo.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'modulo.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'ambiente.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'ambiente.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'ambiente.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'novedad.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'novedad.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'novedad.atender', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'novedad.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'intervencion.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'intervencion.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'intervencion.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.componente', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.trasladar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.verificar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.baja', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'bien.reposicion', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'incidente.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'incidente.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'servicio.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'servicio.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'servicio.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'servicio.periodo', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'hecho.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'hecho.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'hecho.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'vehiculo.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'vehiculo.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'vehiculo.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'itinerario.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'itinerario.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'itinerario.ejecucion', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'itinerario.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'combustible.informar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'combustible.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'combustible.anular', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'mantenimiento.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'mantenimiento.actualizar', NULL FROM DUAL
    UNION ALL SELECT 'CAR', 'ACCION', 'mantenimiento.anular', NULL FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'RUTA', 'centros', 1 FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'RUTA', 'incidencias', 2 FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'RUTA', 'manual', 3 FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'ACCION', 'bien.verificar', NULL FROM DUAL
    UNION ALL SELECT 'VERIFICA', 'ACCION', 'bien.incidente', NULL FROM DUAL
    UNION ALL SELECT 'CHOFER', 'RUTA', 'itinerarios', 1 FROM DUAL
    UNION ALL SELECT 'CHOFER', 'RUTA', 'vehiculos', 2 FROM DUAL
    UNION ALL SELECT 'CHOFER', 'RUTA', 'combustible', 3 FROM DUAL
    UNION ALL SELECT 'CHOFER', 'RUTA', 'manual', 4 FROM DUAL
    UNION ALL SELECT 'CHOFER', 'ACCION', 'itinerario.registrar', NULL FROM DUAL
    UNION ALL SELECT 'CHOFER', 'ACCION', 'itinerario.ejecucion', NULL FROM DUAL
    UNION ALL SELECT 'CHOFER', 'ACCION', 'combustible.informar', NULL FROM DUAL
    UNION ALL SELECT 'CHOFER', 'ACCION', 'combustible.actualizarPropio', NULL FROM DUAL
) g JOIN SGR_PERFIL p ON p.CODIGO = g.PERFIL JOIN SGR_PERMISO m ON m.TIPO = g.TIPO AND m.CODIGO = g.CODIGO) d
ON (t.ID_PERFIL = d.PERFIL AND t.ID_PERMISO = d.PERMISO)
WHEN NOT MATCHED THEN INSERT (ID_PERFIL, ID_PERMISO, ORDEN, ESTADO, ELIMINADO, USU_REGISTRA, FEC_REGISTRA)
VALUES (d.PERFIL, d.PERMISO, d.ORDEN, 1, 0, (SELECT ID FROM SGR_USUARIO WHERE CODIGO = 'SIGREC_TECNICO'), SYSDATE)
@@
