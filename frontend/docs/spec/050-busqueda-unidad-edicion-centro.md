# SPEC 050 — Búsqueda de unidad orgánica al editar un centro

**Actualización:** En la edición de la ficha, el nombre del centro es de solo lectura y no se ofrece búsqueda ni cambio de unidad orgánica. Se conserva el vínculo existente.

Complementa la SPEC 047 y reemplaza su decisión de mantener separado el selector durante la edición.

## Decisiones anteriores, sustituidas por la actualización

- El buscador de unidades orgánicas se activa desde el campo «Nombre del centro» tanto al registrar como al actualizar la ficha.
- En la edición, el nombre de la unidad seleccionada se copia en «Nombre del centro» y su dirección se copia en «Dirección» cuando la respuesta incluye ese dato.
- Al seleccionar otra unidad se actualiza el vínculo `unidadOrganicaId` mediante el contrato de edición existente. Si no se selecciona una unidad distinta, se conserva el vínculo actual, incluso si es histórico o ya no elegible.
- El código del centro es inmutable durante la edición y no se reemplaza con el código devuelto por la unidad orgánica.
- La edición conserva la búsqueda por nombre, el mínimo de tres caracteres, la espera de 400 ms, la paginación y la exclusión de unidades vinculadas a otros centros.

## Criterios de aceptación anteriores

1. La edición ya no presenta un selector separado; el botón de búsqueda está dentro de «Nombre del centro».
2. Abrir el buscador precarga el nombre actual.
3. Elegir una unidad cambia su vínculo y copia su nombre y, si está disponible, su dirección.
4. La elección no cambia el código del centro; guardar sin cambiar la unidad conserva el vínculo existente.
5. La búsqueda y el manejo de respuestas antiguas conservan el comportamiento actual.

## Validación

- Revisión estática del componente y `git diff --check`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
