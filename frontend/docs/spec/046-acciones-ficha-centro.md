# SPEC 046 — Acciones de la ficha del centro

Reemplaza únicamente la fila de acciones del nivel Centro definida en la SPEC 008. Las acciones de módulos y ambientes no cambian.

## Decisiones

- La cabecera de la ficha del centro muestra «Actualizar ficha» como botón visible, conservando `centro.actualizar` y el estado deshabilitado para centros anulados.
- La ficha no muestra el menú «Más acciones» ni ofrece «Anular centro» o «Reactivar centro».
- «Registrar módulo» y «Registrar incidente» conservan su ubicación, permisos y comportamiento.
- El botón de actualización abre el diálogo existente. No cambian la API, las reglas de negocio ni los endpoints de anulación y reactivación.

La ocultación de anulación y reactivación es solo de interfaz; no modifica la autorización del backend.

## Criterios de aceptación

1. Un centro vigente muestra «Actualizar ficha» como botón y no muestra «Más acciones», «Anular centro» ni «Reactivar centro».
2. Un centro anulado mantiene «Actualizar ficha» deshabilitado y no muestra menú ni acción de reactivación.
3. «Registrar módulo» y «Registrar incidente» siguen disponibles según las condiciones actuales.
4. El botón «Actualizar ficha» abre y guarda mediante el diálogo existente.
5. Las acciones de los detalles de módulo y ambiente no cambian.

## Validación

- Revisión estática del componente y `git diff --check`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
