# SPEC 014 — Estabilizar el mapa y la sección Previsto

- **Fecha:** 2026-11-09
- **Estado:** Implementado tras especificar el contrato; validación funcional pendiente de autorización.

## Contract

El mapa mantiene sus 320 px de altura. El número de puntos no genera espacio vacío creciente entre el mapa y «Previsto».

- Desde 616 px disponibles en el componente: dos columnas, mapa y panel de puntos de 320 px. Solo la lista de puntos tiene scroll vertical; «Volver al origen», estado y «Reintentar» permanecen fuera de ella.
- Por debajo de 616 px: una columna, mapa seguido de puntos con altura natural y desplazamiento del formulario.
- El componente usa clases propias y `gap`, sin gutters de márgenes negativos para su distribución. Se conserva la separación de 16 px del formulario antes de «Previsto».
- La lista desplazable tiene `min-height: 0`; sus puntos y los controles del panel no se comprimen. La región se puede enfocar y recorrer con teclado.
- Se conservan alta, edición y consulta; añadir, eliminar, reordenar, arrastrar, cálculo de ruta, validaciones y servicios externos no cambian.
- No se modifican interfaces públicas ni los estilos comunes de otros formularios.

## Acceptance

- Revisar 0, 1, 2, 6 y 12 puntos, nombres largos, estado incompleto, cálculo en curso y error con reintento.
- En escritorio el bloque mapa/puntos no crece al añadir puntos y «Previsto» permanece en la misma posición si no cambia otro contenido del formulario.
- En móvil el bloque crece solo por el contenido visible, sin scroll horizontal ni desplazamiento interno de la lista.
- Revisar anchos de componente 615 y 616 px, pantallas bajas, teclado, cambio manual/mapa y consulta de rutas existentes.
- Solo se autoriza revisión estática. Pruebas, builds, servidores y validación funcional quedan pendientes de autorización explícita.

## Validation

- Estructura Vue, sintaxis JavaScript y bloque CSS revisados con parsers, sin compilar ni ejecutar la aplicación: sin errores.
- Se confirmó que el script del mapa conserva su lógica. `git diff --check` sin errores.
- Pendiente: validación visual y funcional de los escenarios de aceptación; no se ejecutaron pruebas, builds ni servidores.
