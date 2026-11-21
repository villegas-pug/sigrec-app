# SPEC 018 — Catálogo de tipos y precios en modal

- **Fecha:** 2026-11-11
- **Estado:** Implementado después de especificar el contrato; revisión estática completada y validación visual/funcional pendiente de autorización.
- **Complementa:** SPEC 011 y SPEC 013. Conserva el catálogo independiente, sus enlaces y la valoración directa desde Necesidades.

## Contract

- El botón «Tipos de bien y precios» de Necesidades abre un modal sin cambiar la ruta, los filtros, la selección ni la posición de la página.
- El catálogo completo se comparte entre el modal y la pantalla del menú: búsqueda, filtros, inactivos, precios, alta, actualización, anulación y reactivación de tipos según los permisos actuales.
- Ancho de hasta 1100 px limitado al espacio disponible; pantalla completa en móvil. Título y cierre siempre accesibles; contenido con desplazamiento interior, tabla en escritorio y tarjetas en móvil.
- El modal recibe el año y los centros seleccionados en Necesidades. El contexto del conteo «Necesidades que lo usan» se muestra explícitamente e incluye todas las necesidades pendientes de esos centros y año, sin restringir por tipo o clasificación. La pantalla independiente conserva año de revisión y ámbito del perfil.
- Los formularios existentes se abren sobre el catálogo. Guardar, cancelar o descartar cambios devuelve al catálogo con sus filtros y posición conservados; guardar un precio recalcula Necesidades mediante los datos reactivos compartidos.
- «Cerrar», Escape y clic exterior cierran el catálogo. Con un formulario abierto, Escape y clic exterior actúan sobre ese formulario; si tiene cambios pendientes, se conserva la confirmación de descarte y el catálogo permanece abierto.
- Al cerrar el catálogo se devuelve el foco al botón de origen. El enlace «Valorar» de cada necesidad mantiene su comportamiento.

## Interfaces

- Componente compartido de catálogo con año, ids de centros, descripción de contexto y parámetros opcionales de enlace profundo (tipo y filtro). No depende de la ruta de Necesidades.
- Contenedor de modal con modelo de apertura y el mismo contexto. Mantiene abierto el catálogo durante las operaciones secundarias y reutiliza los diálogos y servicios actuales.
- FormDialog valida el cierre solicitado por Cancelar, Escape o clic exterior antes de emitirlo, evitando que el bloqueo de Escape impida confirmar el descarte; mantiene el bloqueo de cierre por ruta cuando hay cambios. AnularDialog admite activar esta protección para el motivo desde el catálogo, sin alterar los demás usos.
- La página independiente conserva `necesidades/precios`, `?tipo=` y `?filtro=`; no hay cambios de backend, almacenamiento o permisos.

## Acceptance

- Apertura y cierre sin navegación ni pérdida de filtros, selección o posición; retorno del foco al botón.
- Año y centros coincidentes con Necesidades; conteos independientes del filtro por tipo y clasificación, y precios que actualizan sus importes al guardar.
- Búsqueda, filtros, inactivos y todas las operaciones autorizadas equivalentes en ambos contenedores; formularios con y sin cambios, cancelación y descarte sin cerrar el catálogo.
- Enlaces profundos existentes, tipos inexistentes, precios ausentes, resultados vacíos y perfiles sin permisos de edición.
- Teclado, foco, nombres extensos, desplazamiento interior, tabla y tarjetas móviles.
- Regresión de los demás formularios que reutilizan FormDialog: Cancelar, Escape, clic exterior y confirmación de cambios pendientes.
- Inicialmente solo revisión estática. No ejecutar pruebas, builds, servidores ni validación visual o funcional sin autorización explícita.

## Validation

- Revisados estáticamente ocho componentes: sintaxis JavaScript, estructura Vue, 349 expresiones de plantilla, estilos locales y 61 imports locales; sin errores. No se compiló ni ejecutó la aplicación.
- `git diff --check` sin errores de formato.
- Revisado el flujo de datos: el modal recibe año/centros, el catálogo limita el contexto al ámbito del perfil y ambos contenedores reutilizan las mismas consultas y operaciones. Necesidades conserva su instancia y sus cálculos reactivos.
- Revisados los enlaces `?tipo=` y `?filtro=`, el resaltado, las acciones según permisos y el cierre protegido de formularios sobre el catálogo. Estas conclusiones proceden de la lectura del código, no de ejecución funcional.
- Validación visual y funcional pendiente de autorización explícita.

## Compatibility

La SPEC 019 sustituye la pantalla independiente por redirección al modal, retira el submenú y establece pantalla completa con paginación.
