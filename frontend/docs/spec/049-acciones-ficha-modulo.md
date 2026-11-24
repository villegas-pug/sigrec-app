# SPEC 049 — Acciones de la ficha del módulo

Reemplaza únicamente la ubicación y disponibilidad de las acciones de módulo definida en la SPEC 020.

## Decisiones

- La cabecera de la ficha muestra «Actualizar módulo» como botón visible, sujeto al permiso `modulo.actualizar` y deshabilitado cuando el módulo está anulado.
- La ficha no muestra «Más acciones» ni ofrece «Anular módulo» o «Reactivar módulo».
- «Registrar ambiente» conserva su ubicación, permiso y comportamiento.
- La actualización abre el diálogo existente. No cambian la API ni los endpoints de anulación y reactivación; la ocultación afecta solo a esta interfaz.

## Criterios de aceptación

1. Un módulo vigente muestra «Actualizar módulo» como botón y no muestra el menú ni opciones de anulación o reactivación.
2. Un módulo anulado mantiene el botón de actualización deshabilitado y no muestra una acción de reactivación.
3. «Registrar ambiente» conserva las condiciones actuales.
4. El botón abre y guarda con el diálogo existente.

## Validación

- Revisión estática del componente y `git diff --check`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
