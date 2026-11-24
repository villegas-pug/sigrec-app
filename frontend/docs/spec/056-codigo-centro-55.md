# SPEC 056 — Código del centro de hasta 55 caracteres

Complementa la SPEC 048. Donde difieran, prevalece esta.

## Decisiones

- `SGR_CENTRO.CODIGO` pasa de `CHAR(3 CHAR)` a `VARCHAR2(55 CHAR)`; se evita `CHAR(55)` porque rellena con espacios y rompería comparaciones y unicidad.
- La regla del código es `[A-Z0-9]{1,55}` en la restricción Oracle `CK_CTR_CEN_CODIGO_ALFANUM`, la entidad `Centro`, `CentroDatos`, `CreateCentroRequest`, `CentroController`, `FiltroConsulta`, `CentroDialog.vue` y `MainLayout.vue`.
- Los códigos existentes (3 caracteres) cumplen la nueva regla; no se migran datos.
- El código de vehículo (`VehiculoServiceImpl`) ya recorta el prefijo del centro a 33 caracteres, por lo que no cambia.
- La migración `database/scripts/056-codigo-centro-55.sql` la aplica el responsable de Oracle antes de desplegar el backend.

## Criterios de aceptación

1. Un código de 1 a 55 caracteres `A-Z0-9` pasa la validación en la SPA, la API y la base de datos; más de 55, vacío, minúsculas sin normalizar y símbolos no pasan.
2. Los códigos existentes siguen funcionando y la unicidad se conserva.

## Validación

- Revisión estática y `git diff --check`; no ejecutar builds, pruebas ni el DDL sin autorización.
