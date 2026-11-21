# SPEC 017 — Selección editable y orientación en Gestión

- **Fecha:** 2026-11-09
- **Estado:** Implementado tras especificar el contrato; validación visual y funcional pendiente de autorización.
- **Complementa:** SPEC 016. Se conservan origen fijo, evaluación individual, permisos, ámbito y reglas patrimoniales.

## Contract

- Diálogo de incidencias de hasta 1000 px; selector reutilizable con tabla desde 760 px de contenido y tarjetas por debajo, sin pasos adicionales ni listas duplicadas de evaluación.
- Nombre, identificador y condición separados; componentes agrupados por principal con selección independiente. Principal no elegible solo como referencia.
- Búsqueda normalizada por nombre/rótulo/código, filtro Solo seleccionados, contador total/ocultos y selección general parcial. Seleccionar resultados suma el conjunto filtrado; Quitar selección vacía toda la selección.
- Evaluación habilitada solo para seleccionados: cantidad editable para lotes, Sí/No sin preselección, condición opcional desplegable. Desmarcar conserva las entradas durante esa edición; el servicio guarda solo seleccionados.
- Resumen compacto en el pie del diálogo. Guardar descubre el primer error aunque esté filtrado, lo enfoca y conserva el resto de entradas.
- Una entrada de creación para centro/ambiente: Registrar incidente. Catálogo de infraestructura reutiliza categorías anteriores sin duplicados; bienes/componentes conservan categorías actuales. Las sugerencias de elementos abren ese formulario. Novedades anteriores siguen consultables, corregibles y atendibles mediante sus enlaces.
- Ruta navegable a antecesores; búsqueda del árbol incluye todos los niveles y conserva antecesores. Si el detalle no coincide con filtros, mostrar aviso y Mostrar en el árbol sin sustituir selección.
- Acción principal contextual: registrar ambiente / registrar bien / actualizar información / registrar reposición. Verificación física prioriza verificar. Registrar incidente permanece secundario; otras acciones en Más acciones con destructivas separadas.
- Historial con fecha/tipo/título/estado y distinción propio/relacionado. Después de guardar, abrir pestaña de hechos, seleccionar resultado y hacerlo visible.

## Interfaces

- Selector conserva ids y modelos `evaluaciones`/`condiciones`; expone validación/enfoque. FormDialog incorpora slot opcional de resumen en el pie, sin cambios a formularios que no lo usan.
- Catálogo ampliado y reconocimiento central de incidencias para vistas, estados, Necesidades y avisos. Sin migración ni duplicación de registros anteriores.

## Acceptance

- 0/1/varios/todos, filtro sin resultados, seleccionados ocultos, lotes, componentes con principal de baja y decisiones mixtas.
- Conservación de entradas al filtrar/desmarcar, error oculto y mismo comportamiento en tabla/tarjetas.
- Categorías de infraestructura e históricas, permisos y conteos sin duplicaciones; visor general consultivo.
- Navegación por teclado, foco, nombres largos, ancho reducido, sin scroll horizontal móvil; retorno y resultado de guardado visibles.
- Solo revisión estática. No ejecutar pruebas, builds, servidores o verificación visual/funcional sin autorización explícita.

## Validation

- Sintaxis JavaScript, estructura Vue, expresiones de plantilla e imports/exports locales revisados con parsers, sin compilar ni ejecutar la aplicación.
- Catálogo de infraestructura compartido y reconocimiento central utilizados por visor, detalle, estados, Necesidades y avisos; registros históricos conservados.
- El selector conserva sus entradas al filtrar/desmarcar, expone validación de todos los seleccionados y usa un único conjunto de controles adaptable por ancho. Los datos guardados siguen limitados a los ids seleccionados.
- El registro nuevo navega a su hecho; la corrección vuelve a seleccionarlo. El árbol conserva selección ante filtros y permite revelar la ficha abierta. Las novedades anteriores conservan corrección, atención y enlaces.
- Revisión visual/funcional pendiente para todos los escenarios de Acceptance, incluidos foco, errores filtrados, selección parcial, móvil y conteos. No se ejecutaron pruebas, builds ni servidores.
