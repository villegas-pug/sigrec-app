# SPEC 034 — Estado del bien derivado de sus hechos (fase 3)

## Problema

Al cierre de la SPEC 033, `src/data/bienes.json` aún guardaba tres estados que el ERD 7.2.0 deriva de otras tablas.

| Campo guardado | Regla del ERD |
| --- | --- |
| `situacion` (`activo`, `baja`, `anulado`) | `baja` si existe una `SGR_BAJA` vigente del bien; `anulado` si el bien está eliminado (`ESTADO`/`ELIMINADO`); si no, activo. |
| `verificacion` (`fecha`, `resultado`, `nota`) | La verificación vigente más reciente de `SGR_HISTORIAL_BIEN` con `TIPO = 'VERIFICACION'` (`RESULTADO`, `DETALLE`). |
| `revisionPendiente` | Un componente de una baja vigente (`SGR_BIEN_IMPLICADO`, `ROL = 'COMPONENTE'`) sin `RESOLUCION`. |

Las verificaciones conservaban el resultado como texto y los cambios de condición carecían de valores estructurados para la condición anterior y la nueva. Acciones como `darDeBaja`, `anularBaja` y `cerrarRevision` mantenían las copias de estado.

## Comportamiento requerido

**Prioridad absoluta:** el cambio es transparente. La interfaz, los textos, el orden de los listados, las interacciones y los cálculos no cambian.

### Estado derivado (`services/datos.js`)

| Helper | Resultado |
| --- | --- |
| `bajaDe(bienId)` | El primer hecho vigente de tipo `baja` cuyo primer implicado es el bien, o `null`. Se define en `datos.js` y se reexporta en `bienes.js`. |
| `situacionDe(bien)` | `anulado` si el bien lleva `anulacion`, `baja` si tiene una baja vigente, `activo` en los demás casos y `undefined` si falta el bien. |
| `verificacionDe(bien)` | `{ fecha, resultado, nota }` del último hecho vigente de tipo `verificacion` que incluye al bien. Usa el orden de registro y toma `nota` de `detalle` o devuelve `null` como nota si el detalle está vacío. Devuelve `null` si falta el bien o su verificación. |
| `revisionPendienteDe(bien)` | `true` si alguna baja vigente incluye al bien en `componentes[]` sin `resolucion`. Devuelve `false` en los demás casos, incluso si falta el bien. |
| `situacionDeRegistro(registro)` | El resultado de `situacionDe` para un registro con `tipoId`. Devuelve `undefined` en los demás casos. |

Las consultas de hechos en `datos.js` leen directamente `db.eventos`, excluyen las novedades y consideran vigente un registro que carece de `anulacion`.

Los bienes semilla y los que crea `registrarBien` omiten `situacion`, `verificacion` y `revisionPendiente`. La anulación del bien deja de guardar `situacionPrevia`. Al reactivarlo, su situación se deriva de la baja vigente.

### Historial estructurado (`eventos`)

- **Verificación:** el hecho guarda `resultado` (`coincide` o `diferencias`), además de su texto.
- **Cambio de condición:** el hecho guarda `condicionAnterior` y `condicionNueva`.
- **Baja:** cada elemento de `componentes[]` (`{ bienId, posicion }`) admite `resolucion` y `fechaResolucion` (`SGR_BIEN_IMPLICADO.RESOLUCION` y `FEC_RESOLUCION`). Las resoluciones son:

  | Resolución | Acción que la registra |
  | --- | --- |
  | `cierre` | «Mantener activo» o «Cerrar revisión» |
  | `asociacion` | Asociar el componente a otro bien |
  | `desasociacion` | Desasociarlo |
  | `traslado` | Trasladarlo por separado |
  | `reposicion` | Reasignar al bien nuevo un componente que figura en la baja original. Al anular la reposición, se quitan esta resolución y su fecha de los componentes reasignados que la tienen. |

  Dar de baja el propio componente conserva su revisión pendiente. La fecha de resolución del traslado o la reposición se toma de la fecha informada, con `FECHA_CORTE` como valor por defecto. Las demás resoluciones usan `FECHA_CORTE`.

- **Semillas:**
  - EV-004 guarda una lista vacía de componentes y EV-008 guarda los dos colchones de AMA-D2-C04. En el detalle de estas bajas semilla se muestran las asociaciones actuales.
  - EV-001 guarda `condicionAnterior: 'bueno'` y `condicionNueva: 'regular'`.
  - EV-009 guarda `resultado: 'coincide'` y conserva el punto final de su detalle original. Ese detalle se devuelve como nota derivada.

### Verificaciones de la carga inicial

De los 23 bienes semilla que ya tenían una verificación, 22 carecían de un hecho correspondiente. La migración añadió esos 22 hechos de tipo `verificacion` con `cargaInicial: true` a `db.eventos`. Equivalen a filas migradas de `SGR_HISTORIAL_BIEN`. EV-009 ya existía como hecho visible.

- `verificacionDe` incluye las verificaciones de carga inicial al consultar `db.eventos`.
- `eventosRegistrados()` excluye los hechos con `clase: 'novedad'` o `cargaInicial: true`. Por eso las verificaciones migradas quedan fuera de los antecedentes y del control de hechos posteriores al anular una reposición.

## Riesgos aceptados

- **Lectores nuevos.** Deben usar los helpers para consultar el estado derivado del inventario.
- **Origen de las bajas.** El detalle distingue una baja semilla de una registrada desde la aplicación por la presencia de `registradoEl`. Incorporar ese campo en una semilla con `componentes[]` haría que el detalle mostrara la lista histórica.
- **Componente que vuelve a quedar pendiente por otra baja.** Un componente pendiente por la baja de un bien A puede asociarse a otro bien B, y B puede darse de baja después.
  - Antes, anular la baja de A le quitaba la marca de revisión aunque siguiera pendiente por la baja de B.
  - Ahora sigue pendiente mientras la baja de B esté vigente, que es lo que indica el ERD.
  - El caso no se da en los datos semilla.

## Resultados de verificación

Las 1.076 capturas de texto coinciden con sus líneas base (0 diferencias).

| Prueba | Capturas |
| --- | --- |
| Recorrido de inventario | 535 |
| Flujos de inventario | 141 |
| Recorrido general | 92 |
| Flujos generales | 22 |
| Recorrido de centros | 229 |
| Flujos de centros | 44 |
| Altas | 13 |

`npm run build` terminó sin errores. La consola del navegador y el validador del ERD registraron 0 errores.

> Vite advirtió durante el build que `motorWhisper.js` se importa de forma estática y dinámica. La importación dinámica no genera un bloque separado.

### Corrección durante la verificación

Tras desvincular los dos colchones de la baja semilla EV-008, Incidencias seguía mostrándolos porque el detalle leía los componentes guardados por la migración. Para las bajas semilla, el detalle vuelve a consultar las asociaciones actuales. Para las bajas registradas desde la aplicación, identificadas por `registradoEl`, muestra los componentes del momento del registro. Los registros históricos de las bajas semilla se conservan para derivar la revisión. Tras la corrección, los flujos de inventario pasaron de 1 diferencia a 0. [DetalleHecho.vue](../../src/components/bienes/DetalleHecho.vue)
