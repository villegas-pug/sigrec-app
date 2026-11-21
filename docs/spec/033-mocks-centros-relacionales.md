# SPEC 033 — Datos ficticios de centros en colecciones del modelo ER (fase 2)

## Problema

Tras la SPEC 032, los datos de «Centros e infraestructura» siguen anidados en sus registros padre, mientras que el ERD 7.1.0 los modela como tablas propias:

| Dato anidado | Entidad del ERD |
| --- | --- |
| `car.inmueble.fotos[]` (con `ambienteId` opcional) y `bien.fotos[]` | `SGR_FOTO`, con arco exclusivo `ID_CENTRO` / `ID_AMBIENTE` / `ID_BIEN` |
| `estadoElementos{}` y `elementosAdicionales[]` en `inmueble.construccion`, módulos y ambientes | `SGR_ELEMENTO`, una fila por elemento, con arco centro / módulo / ambiente y clave normalizada |
| `ambiente.intervenciones[]` | `SGR_INTERVENCION` (`ID_AMBIENTE`) |
| `ambiente.novedades[]` | `SGR_INCIDENTE` con `CLASE = 'NOVEDAD'` y origen ambiente (SPEC 028), más `SGR_ATENCION` |

## Comportamiento requerido

**Prioridad absoluta:** el cambio es transparente. La interfaz, los textos, el orden de los listados, las interacciones y los cálculos no cambian.

| Dato | Colección | Forma del registro |
| --- | --- | --- |
| Fotografías | `db.fotos` (`aplicaciones/sigrec/frontend/src/data/fotos.json`) | `{ id, carId \| ambienteId \| bienId, titulo, fecha, nota, url, nombreArchivo, registradoPor }`. Una foto de ambiente referencia solo al ambiente, y su centro se obtiene del ambiente. |
| Elementos | `db.elementos` (`aplicaciones/sigrec/frontend/src/data/elementos.json`) | `{ id, carId \| moduloId \| ambienteId, clave, nombre, condicion }`. `nombre` solo se informa en un elemento agregado; un elemento base solo existe si está evaluado. |
| Intervenciones | `db.intervenciones` (`aplicaciones/sigrec/frontend/src/data/intervenciones.json`) | `{ id, ambienteId, descripcion, fecha, esPintado, informadoPor }` |
| Novedades | `db.eventos`, con `clase: 'novedad'` | `{ id, clase, fecha, tipo, titulo, detalle, ubicacion, requiereEvaluacion, origen: { tipo: 'ambiente', id }, ambienteId, carId, informadoPor, atencion? }` |

**Lectura y escritura sin cambios en los componentes:**

- `services/centros.js` reúne los accesos:
  - `fotosDe`;
  - `estadoElementosDe` y `elementosAdicionalesDe`, que devuelven la forma anterior;
  - `intervencionesDe`;
  - `novedadesDe` y `novedadPorId`;
  - `eventosRegistrados()`: los hechos sin las novedades. La usan todos los lectores de `db.eventos` que antes no veían novedades.
- Las acciones (`acciones.js`) traducen `estadoElementos` y `elementosAdicionales` a filas cuando se registra o actualiza un centro, un módulo o un ambiente.
- Las listas se devuelven en el mismo orden relativo que antes:
  - intervenciones: la más reciente registrada primero;
  - fotos y novedades: en orden de registro;
  - elementos agregados: en el orden en que se agregaron.

## Riesgos aceptados

- **Novedades:** quedan en la misma colección que los hechos de incidencias. Un lector nuevo de `db.eventos` debe usar `eventosRegistrados()` para no mezclarlas.
- **Centro de las fotos de ambiente:** se deriva del ambiente. Un ambiente solo cambia de módulo dentro de su centro, así que el resultado es el mismo.

La migración de las semillas comprueba que cada JSON reducido sea exactamente el original menos las claves extraídas. Resultado:

- 5 fotos;
- 29 elementos;
- 7 intervenciones;
- 3 novedades.

Las intervenciones semilla, que no indicaban si eran un pintado, quedan con `esPintado: false`, como se mostraban.

El ERD pasa a 7.2.0 solo para registrar como fuentes las colecciones nuevas y `services/centros.js`.

Registrar una novedad nueva no está disponible en la interfaz: «Registrar incidente» abre la incidencia. `registrarNovedad` se adaptó igualmente al nuevo formato.

## Verificación autorizada

Las 400 capturas coinciden con su línea base (0 diferencias):

| Prueba | Capturas |
| --- | --- |
| Recorrido de Gestión de centros: cada nodo con cada pestaña, perfiles `central` y `car` | 229 |
| Flujos de escritura de centros (ver abajo) | 44 |
| Recorrido general de la SPEC 032 | 92 |
| Flujos de la SPEC 032 | 22 |
| Altas de módulo y ambiente con elementos y cambio de ambiente de una foto, comparadas con `HEAD` | 13 |

Los flujos de escritura de centros:

- elementos de un módulo, con alta y baja de un elemento agregado;
- elementos de ambientes y de la ficha del centro;
- registrar y anular una intervención;
- incorporar, actualizar y anular fotografías de ambiente, centro y bien;
- actualizar, anular y atender novedades.

Además, `npm run build` termina sin errores, la consola del navegador no muestra errores y el validador del ERD no informa errores.
