# SPEC 027 — Modelo ER: incidencias y patrimonio en tres tablas

## Problema

En el modelo entidad-relación (`docs/modelo-er/data/modelo.json`), el módulo «Incidencias y patrimonio» tiene siete tablas: `SGR_TIPO_INCIDENCIA`, `SGR_INCIDENTE`, `SGR_INCIDENTE_BIEN`, `SGR_BAJA`, `SGR_BAJA_BIEN`, `SGR_REPOSICION` y `SGR_REPOSICION_BIEN`. Varias son redundantes:

- `SGR_REPOSICION` admite a lo sumo una fila vigente por baja.
- `SGR_REPOSICION_BIEN` repite lo que ya expresa `SGR_BAJA_BIEN.RESOLUCION = 'REPOSICION'`.
- El catálogo de tipos también lo usa `SGR_NOVEDAD`, que pertenece al módulo de centros.

El prototipo registra todos estos hechos en un único arreglo `eventos`.

## Comportamiento requerido

Reducir el módulo a tres tablas sin perder reglas ni trazabilidad al prototipo. Solo cambian el modelo ER y su README; la SPA y el código del visor no se modifican.

| Tabla | Resultado |
| --- | --- |
| `SGR_TIPO_INCIDENCIA` | Pasa al módulo `centros`, junto a su otro consumidor, `SGR_NOVEDAD`. Conserva el alias, las FK y los valores. |
| `SGR_INCIDENTE` | Sin cambios. |
| `SGR_BAJA` | Absorbe la reposición: `FEC_REPOSICION`, `DETALLE_REPOSICION` e `ID_NUEVO_BIEN`, opcionales e informados juntos. `ID_NUEVO_BIEN` es único y distinto del bien dado de baja. |
| `SGR_BIEN_IMPLICADO` | Nueva. Sustituye a `SGR_INCIDENTE_BIEN`, `SGR_BAJA_BIEN` y `SGR_REPOSICION_BIEN`. Cada fila tiene un `ROL`: `AFECTADO` (hija de una incidencia) o `COMPONENTE` (hija de una baja). Las referencias forman un arco exclusivo, el mismo patrón de `SGR_ATENCION`. Cada rol exige sus columnas y anula las del otro. |

## Mapeo desde el prototipo

| Prototipo (`src/services/acciones.js`) | Modelo |
| --- | --- |
| Incidencia: `bienIds` + `evaluaciones` | Filas `AFECTADO` (`CANT_AFECTADA`, `REQUIERE_REPOSICION`, `FUENTE_EVALUACION`, `ID_CONDICION`) |
| Baja: `componentes[{ bienId, posicion }]` | Filas `COMPONENTE` con `POSICION` |
| `bien.revisionPendiente` | `RESOLUCION IS NULL` |
| Reposición: `bienNuevoId`, `fecha`, `detalle` | Columnas de reposición de `SGR_BAJA` |
| Reposición: `trasladados` | `RESOLUCION = 'REPOSICION'`; el nuevo principal es `SGR_BAJA.ID_NUEVO_BIEN` |
| `anularReposicion` | Anula el reemplazo, limpia la reposición en la baja y devuelve los componentes a `RESOLUCION = NULL` |

## Riesgos aceptados

- Al revertir una reposición, la baja deja de conservar sus datos. Quedan la auditoría de actualización de la baja y la anulación del bien de reemplazo en `SGR_BIEN`.
- La unicidad de un componente por baja, antes una clave permanente, pasa a aplicarse solo entre filas vigentes. En Oracle, una clave compuesta con `ID_BAJA` nulo compararía también las filas de afectados.
- La obligatoriedad de las columnas de evaluación pasa de `NOT NULL` a un `CHECK` por rol.

## Verificación autorizada

- `validateModel(expandModel(modelo))` devuelve una lista vacía.
- El módulo `incidencias` tiene tres tablas.
- Ninguna regla, proceso ni FK cita una tabla retirada.
- `git diff --check` no informa problemas.
- La revisión visual del visor queda a cargo del usuario.
