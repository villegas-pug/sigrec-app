# SPEC 047 — Búsqueda de unidad orgánica en el alta de centro

Complementa la SPEC 045 para el flujo de registro de centros. La edición de centros mantiene el selector de unidad orgánica separado.

## Decisiones

- El buscador de unidades orgánicas se activa desde el campo «Nombre del centro». El texto escrito en ese campo inicia la búsqueda en el diálogo existente.
- Al seleccionar una unidad disponible, SIGREC asigna `id` a `unidadOrganicaId` y copia `nombre`, `codigo` y `direccion` en los campos Nombre del centro, Código y Dirección.
- Los tres campos siguen siendo datos propios del centro y editables antes de guardar. Si el endpoint no devuelve código o dirección, el campo queda vacío y conserva su validación actual.
- Se mantienen la búsqueda por nombre, el mínimo de tres caracteres, la espera de 400 ms, la paginación y el bloqueo de unidades ya vinculadas a otro centro.
- La selección de unidad sigue siendo obligatoria; guardar sin una selección válida muestra «Seleccione una unidad orgánica.».
- No cambian la API, el modelo de datos, la edición de centros ni el selector de unidades de ese flujo.

## Criterios de aceptación

1. El alta ya no muestra una fila separada para «Unidad orgánica»; el botón de búsqueda está dentro del campo «Nombre del centro».
2. Abrir el buscador precarga el texto del nombre, y seleccionar una unidad copia nombre, código y dirección en sus campos.
3. El alta conserva el vínculo con el ID de la unidad seleccionada y bloquea el guardado si no hubo selección.
4. Los valores ausentes o inválidos siguen mostrando las validaciones actuales y pueden completarse antes de guardar.
5. La búsqueda, paginación y protección contra respuestas antiguas siguen funcionando.

## Validación

- Revisión estática y `git diff --check`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
