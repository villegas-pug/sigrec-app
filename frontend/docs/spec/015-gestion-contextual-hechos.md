# SPEC 015 — Gestión contextual de hechos y visor consultivo

> Actualización: la [SPEC 016](016-incidencias-origen-reposicion-individual.md) sustituye la selección de ubicación y la decisión global de reposición por un origen fijo y evaluación individual. Las reglas patrimoniales permanecen vigentes.

- **Fecha:** 2026-11-09
- **Estado:** Implementado tras especificar el contrato; validación funcional pendiente de autorización.
- **Sustituye:** SPEC 004 §1 decisiones 1 y 3 respecto al origen de los formularios y decisión 5 respecto al inicio desde el visor; SPEC 005 respecto a iniciar bajas y reposiciones desde Necesidades. Las reglas de negocio se conservan.

## Contract

- Incidencias, bajas y reposiciones es un visor general: filtros, detalle, estados e historiales; sin formularios, correcciones, anulaciones, reactivaciones ni apertura automática de tareas. Necesidades muestra el paso pendiente y un enlace de consulta a la ficha.
- Gestión de centros conserva las altas desde el bien. El ambiente permite registrar un incidente sobre uno o varios bienes del mismo ambiente, con ubicación fija.
- Antecedentes del bien permite seleccionar incidentes, bajas y reposiciones; la pestaña Incidencias del ambiente muestra sus incidentes y bienes afectados. Incluye consulta de anulados.
- Correcciones desde el hecho seleccionado: actualizar/anular/reactivar incidentes; anular bajas y reposiciones con las dependencias actuales. No se añade reactivación patrimonial ni se amplían permisos.
- Consultas y estados compartidos; detalle reutilizable de solo lectura con slot de acciones que solo rellena Gestión.
- `incidencias?hecho=` se conserva. `centros?bien=&hecho=` abre Antecedentes; `centros?ambiente=&hecho=` abre Incidencias. Un hecho sin contexto explícito abre su ambiente si es incidente, o el bien anterior para baja/reposición.
- Los identificadores se validan por existencia, relación y ámbito. Un hecho incompatible o ajeno muestra Registro no disponible, sin sustituirlo por otro. Ningún enlace abre formularios.
- Historial y retorno conservan filtros, selección y posición. Al guardar se permanece en Gestión y se actualizan los antecedentes.

## Acceptance

- Visor y Necesidades no importan ni montan formularios o servicios de mutación de estos hechos.
- Revisar registro individual/múltiple, baja, reposición y componentes; actualización/anulación/reactivación de incidentes; reversión en orden inverso de reposición y baja.
- Revisar perfiles central, CAR y verificación; hechos anulados, bienes trasladados, contexto incompatible, ámbito ajeno y retorno.
- Estados y conteos de necesidades conservados; teclado, escritorio y móvil.
- Pruebas, builds, servidores y validación funcional requieren autorización explícita; revisión inicial estática.

## Validation

- Revisión estática de estructura Vue, expresiones de plantilla, sintaxis JavaScript e imports/exports locales realizada sin ejecutar la aplicación.
- Visor y Necesidades no montan los formularios de estos hechos ni invocan sus mutaciones. El detalle compartido es consultivo; su contenedor operativo vive en Gestión.
- Se conserva la lógica existente de estados y dependencias de reversión; el salto a otro antecedente abre un contexto validado y conserva el retorno.
- Registro individual/múltiple, correcciones, reversión, permisos por perfil, conteos, teclado y móvil: pendientes de validación funcional autorizada.
