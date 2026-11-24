# SPEC 045 — Unidad orgánica del centro

## Alcance

Alta y edición de centros en SIGREC consultan `TGUNIDADORGANICA`, en el mismo esquema Oracle. SIGREC guarda solo el vínculo a `IDUNIDADORGANICA`. Nombre, código y dirección propios del centro siguen siendo independientes.

## Reglas

- Alta exige una unidad activa (`UORESTADO = 1`) y no eliminada (`UORELIMINADO = 0`). La FK es nullable para conservar los centros históricos, sin completar datos por aproximación.
- Editar permite conservar el vínculo (o su ausencia histórica) y asignar o reemplazar con una unidad elegible. Omitir el ID o enviar `null` conserva el valor actual; no se admite desvincular sin reemplazo. Si la unidad actual deja de ser elegible, se muestra con advertencia, pero no impide guardar otros cambios.
- Una unidad solo puede pertenecer a un centro, incluso si está anulado. Al reemplazarla, la anterior queda libre al confirmar la transacción. La restricción única resuelve la concurrencia y la API responde `409` si la unidad ya se asignó.

## Contrato y experiencia

`GET /api/v1/centros/unidades-organicas?q=…&pagina=1` devuelve `{ items, total }` en el sobre REST habitual. La búsqueda empieza con tres caracteres, por fragmento literal del nombre, sin distinguir mayúsculas ni tildes. La paginación es de cinco filas, ordenadas de forma estable. Las unidades activas y no eliminadas ya vinculadas siguen visibles, con un indicador de ocupación. El parámetro opcional `centro` identifica el centro editado para no considerar ocupado su propio vínculo.

La tabla se abre en un diálogo compartido; espera 400 ms después de escribir antes de consultar, y no aplica respuestas de una búsqueda anterior. Nombre, código de la unidad y dirección son de solo lectura. La ficha recupera su unidad por ID sin filtrar su estado. Las escrituras aceptan `unidadOrganicaId`, y la respuesta incluye `unidadOrganica` con el resumen actual.

## Despliegue y aceptación

- Antes del backend, el responsable de Oracle confirma una clave primaria o única en `TGUNIDADORGANICA.IDUNIDADORGANICA` y revisa y aplica el DDL versionado. SIGREC no crea ni modifica la tabla de origen y sigue arrancando con validación del esquema.
- Verificar búsquedas con tildes, varias páginas y coincidencias ocupadas; alta sin unidad; edición de un histórico sin vínculo y con una unidad inactiva; reemplazo; y conflicto por dos guardados de la misma unidad. Revisar el costo de la comparación por fragmento en Oracle si el catálogo crece.
- La E2E simulada `frontend/e2e/intranet-carga.cjs` no escribe en Oracle. Para la prueba real de persistencia, `crear` requiere `SIGREC_E2E_UNIDAD_ID` y `SIGREC_E2E_UNIDAD_NOMBRE` de una unidad activa, libre y reservada para pruebas; debe ser la única fila con ese nombre en la primera página. La limpieza lógica conserva la asociación, por lo que no se debe tomar una unidad operativa.
