# SPEC 016 — Origen fijo y reposición individual

- **Fecha:** 2026-11-09
- **Estado:** Implementado tras especificar el contrato; validación funcional pendiente.
- **Actualiza:** SPEC 015 (origen y alcance por nivel), SPEC 004 (decisión por recurso), SPEC 005 (presentación contextual). Se mantienen las reglas patrimoniales y el visor consultivo.

> La [SPEC 017](017-ux-afectados-gestion.md) amplía la presentación de afectados, el catálogo de infraestructura y la entrada única para incidencias nuevas; conserva este contrato de origen y evaluación individual.

## Contract

| Origen | Padre fijo | Afectados |
| --- | --- | --- |
| Centro | No aplica | Ningún descendiente |
| Ambiente | Centro | Cero o más bienes y componentes activos del ambiente, con selección individual/todos/ninguno |
| Bien | Ambiente | Solo el propio bien |
| Componente | Bien principal | Solo el propio componente |

- Contexto informativo, sin selectores de ubicación. Para otro origen se cierra el formulario y se elige otra ficha.
- El centro muestra hechos propios. El ambiente reúne sus incidencias y novedades de infraestructura anteriores, manteniendo sus acciones/enlaces. Los afectados consultan hechos relacionados sin corregirlos fuera del origen.
- Incidentes nuevos: `origen: { tipo, id }`, contexto padre/ubicación guardados, `evaluaciones: { [bienId]: { requiereReposicion, unidades } }`; centro admite `ambienteId: null` y conserva `carId`.
- Cada afectado exige Sí/No sin preselección; la cantidad afectada se valida contra su cantidad. Un componente no hereda selección ni evaluación del principal.
- La evaluación individual prevalece sobre `reportaNecesidad` histórico, incluyendo el No explícito. Si no existe, se interpreta el valor histórico. Incidentes antiguos sin origen explícito conservan como origen el ambiente registrado; bajas/reposiciones conservan su bien de referencia.
- Sí genera necesidad por incidente mientras el bien esté activo; No no elimina la necesidad por vida útil. Se mantienen una necesidad por bien, precios referenciales y reglas de baja previa y reversión.
- Centro/ambiente admiten evaluación de infraestructura sin costo estimado, independiente de la reposición de recursos. Equipo central y Personal del CAR operan estos niveles; Verificación física conserva bienes/componentes.
- Reposición se inicia únicamente en el bien de baja: «Registrar reposición: alta del bien nuevo». Se explicitan requisitos y relación anterior/nuevo; no se duplica el alta.
- Los enlaces actuales y la validación de existencia, contexto y ámbito se conservan. La ubicación de los hechos se resuelve centralmente, incluyendo los que no tienen ambiente.

## Acceptance

- Cuatro niveles con padre/origen fijos; centro sin ambiente; ambiente sin bienes; todos/algunos/ninguno y componentes con principal de baja.
- Decisiones mixtas, cantidades de lote, No explícito frente a Sí histórico, vida útil, anulación y datos anteriores sin cambios de conteos.
- Coherencia de estados, Necesidades, simulador, avisos e importes. Centro/ambiente en evaluación sin valoración inventada.
- Relacionados consultivos, corrección en origen, permisos por perfil, enlaces antiguos, alta única y selección del bien nuevo.
- Teclado, escritorio, móvil y flujos funcionales pendientes de autorización. Solo revisión estática; sin pruebas, builds ni servidores.

## Validation

- Estructura Vue, expresiones de plantillas, sintaxis JavaScript e imports/exports locales revisados con parsers; sin compilar ni ejecutar la aplicación.
- Revisados los consumidores de `reportaNecesidad`: Necesidades, avisos y estados consultan la evaluación individual con respaldo histórico. Los formularios nuevos ya no capturan una decisión global.
- Se mantienen los JSON originales y las reglas de alta por reposición y reversión. La coincidencia funcional de cifras y escenarios queda pendiente de autorización.
- El contexto del formulario es fijo; los relacionados son consultivos y las correcciones solo se ofrecen en origen. Las novedades anteriores mantienen su alias `tab=novedades` dentro de Incidencias.
- `git diff --check` sin errores. No se ejecutaron pruebas, builds, servidores ni navegación funcional.
