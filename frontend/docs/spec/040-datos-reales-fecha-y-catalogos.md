# SPEC 040 — Datos reales, fecha del sistema y catálogos del backend

Complementa la SPEC 037 (`frontend/src/data/*.json` solo se importaba al backend) y deja sin efecto la fecha de corte fija de las SPEC 001, 004, 010 y 034.

## Contexto

La SPA ya lee y escribe todo por REST. Lo que seguía pareciendo ficticio era: (1) los datos cargados en Oracle por las clases `*DemoImport`; (2) la fecha fija `FECHA_CORTE = 2026-10-30` y los años 2026–2028; (3) catálogos definidos como constantes del navegador.

## Decisiones

### Sin importación de demostración
- Se eliminan las seis clases `*DemoImport`, los métodos `importar(...)` que solo ellas usaban, el `<resource>` de `../frontend/src/data` en `backend/pom.xml` y la propiedad `sigrec.demo.importar`.
- `frontend/src/data/*.json` se conserva solo como referencia del modelo ER y de los guiones del manual; la aplicación no los lee.
- Para limpiar los datos ya cargados en Oracle se entrega `database/scripts/limpieza-datos-demo.sql` (no se ejecuta desde el repositorio). Conserva catálogos, perfiles, permisos y el actor técnico `SIGREC_TECNICO`.

### Fecha del sistema
- Frontend: `hoy()` en `utils/fechas.js` devuelve la fecha local de `America/Lima`; nunca se usa `toISOString()`. Año de revisión = año actual + 1; selector de revisión = año actual, +1 y +2; servicios = año actual.
- Backend: `shared/model/Hoy.fecha()` usa un `Clock` en `America/Lima`, reemplazable en pruebas. Sustituye a `FechaCorte.DIA`.
- La regla «no puede ser posterior a hoy» se mantiene, con el mensaje «No puede ser posterior a hoy».

### Catálogos
- Se cargan de `GET /api/v1/catalogos` y reemplazan los valores locales de `CONDICION`, `ELEMENTO_BASE`, `CATEGORIA_BIEN`, `TIPO_SERVICIO`, `TIPO_INCIDENCIA` y `TIPO_MANTENIMIENTO` (código, nombre, orden, vigencia, `mesesSugeridos`).
- Permanecen en el cliente, como presentación por código: `tono`, `icono`, la distinción extintor/equipo de mantenimiento y los estados calculados.
- Permanecen como constantes porque en la base son `CHECK` y no dominios de `SGR_CATALOGO`: condición del inmueble, tipo de módulo, periodicidad, situación de período, hecho de servicio y estado del vehículo. Pasarlos al catálogo exige cambiar el modelo ER.
