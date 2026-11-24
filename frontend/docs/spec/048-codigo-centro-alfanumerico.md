# SPEC 048 — Código alfanumérico del centro

Complementa las SPECS 045 y 047. Reemplaza la regla de tres letras por exactamente tres caracteres alfanuméricos ASCII en mayúsculas.

## Decisiones

- El código del centro admite `A-Z` y `0-9` en cualquiera de sus tres posiciones; ejemplos válidos: `ABC`, `A1B` y `123`.
- El formulario convierte la entrada a mayúsculas y mantiene la longitud de tres caracteres y la unicidad.
- La API valida el mismo formato al registrar, al recibir un código en los datos del centro y al excluir el centro actual de la búsqueda de unidades orgánicas. El código sigue siendo inmutable al editar la ficha.
- `SGR_CENTRO.CODIGO` conserva su tipo `CHAR(3 CHAR)`. La restricción Oracle se reemplaza por una que acepte letras y dígitos.
- La migración versionada agrega primero la nueva restricción y luego elimina la anterior. Debe aplicarla el responsable de Oracle antes de desplegar el backend; no se ejecuta desde la aplicación.
- No cambian las rutas, el payload ni la regla de unicidad del código.

## Criterios de aceptación

1. `ABC`, `A1B` y `123` pasan la validación; códigos con menos o más de tres caracteres, minúsculas sin normalizar y símbolos no pasan.
2. La entrada del formulario se normaliza a mayúsculas y conserva la validación de código único.
3. La API y la base de datos aceptan el mismo conjunto de códigos.
4. La migración solo sustituye la restricción; no modifica el tipo ni los valores existentes.

## Validación

- Revisión estática del frontend, backend, modelo ER y DDL versionado; `git diff --check`.
- No ejecutar pruebas, builds, servidores ni aplicar el DDL sin autorización explícita.
