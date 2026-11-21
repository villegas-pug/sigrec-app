# SPEC 019 — Catálogo único en modal paginado

- **Fecha:** 2026-11-11
- **Estado:** Especificado antes de implementar; revisión estática completada; validación visual y funcional pendiente.
- **Sustituye:** La pantalla independiente de la SPEC 018. Corrección de dimensiones especificada antes de implementar: el catálogo ocupa el interior del modal.

## Contract

- Catálogo único en modal centrado de hasta 1100 px de ancho y 800 px de alto, limitado al espacio disponible con margen exterior; en móvil conserva la presentación maximizada de los diálogos existentes. Sin submenú; permisos conservados explícitamente. Necesidades mantiene su botón. Registro de bienes abre el mismo modal sin desmontar ni perder el formulario.
- La ruta antigua redirige a Necesidades con `catalogo=precios`, `tipoCatalogo` y `filtroCatalogo`, sin aplicar estos últimos a los filtros de Necesidades. Apertura automática una vez por entrada del historial.
- Cinco filas desde 900 × 600 px interiores del catálogo, medidos sin depender del tamaño de la ventana; una tarjeta en espacios inferiores. La tabla ocupa el ancho y alto restantes entre filtros y paginador, distribuyendo las filas en esa área. Filtros compactos desplegables, título, cierre, búsqueda y paginador accesibles. Catálogo principal sin desplazamiento horizontal ni vertical; detalles y formularios secundarios permiten desplazamiento.
- Filtrar antes de paginar; reiniciar página al cambiar filtros; ajustar la última página después de operaciones. Conservar el primer registro visible al cambiar distribución. Enlaces profundos seleccionan la página del tipo y permiten valoración según permisos.
- Conteos del año y centros del contexto, sin filtrar por tipo o clasificación de Necesidades. Conservar campos, filtros y foco al cerrar operaciones.

## Acceptance

- 0, 1, 5, 6 y múltiples páginas; búsqueda, inactivos, operaciones en última página y cambios de tamaño.
- Accesos desde Necesidades, registro de bienes, URL antigua, tipos inexistentes, historial y perfiles.
- Teclado, foco, textos largos, zoom y ausencia de scroll en catálogo; consulta completa mediante detalle.
- Solo revisión estática inicialmente. Pruebas, builds, servidores y validación visual o funcional requieren autorización explícita.

## Validation

- Sintaxis JavaScript, estructura y expresiones de plantillas, estilos e imports locales revisados en siete archivos, sin errores. `git diff --check` sin errores.
- Revisión de permisos explícitos, redirección con parámetros separados, paginación del conjunto filtrado y conservación del formulario al abrir el catálogo contextual.
- No se ejecutaron pruebas, builds, servidores ni validación visual o funcional; esta última queda pendiente de autorización.
- Corrección de dimensiones: revisión estática de los dos componentes del catálogo sin errores en JavaScript, plantillas y estilos. Se utiliza QResizeObserver sobre el contenedor interior; el alto de tabla ocupa el área restante y sus filas no tienen altura fija. Las reglas compactas dependen del contenedor. Modal de 1100 × 800 px limitado por los márgenes y dimensiones disponibles; altura completa en móvil. Confirmación visual de cinco filas, controles y ausencia de recortes pendiente de autorización.
