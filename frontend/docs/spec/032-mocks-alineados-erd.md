# SPEC 032 — Datos ficticios alineados con el modelo ER (fase 1)

## Problema

Los datos ficticios de la SPA (`frontend/src/data/*.json`, cargados tal cual en `frontend/src/services/datos.js`) y el modelo ER optimizado (`database/modelo-er/data/modelo.json`, 7.0.0) describen el mismo dominio. El ERD es la fuente de verdad y se dedujo de estos datos y de `frontend/src/services/acciones.js`.

Las diferencias son de dos clases:

1. **Representación.** Los mocks son documentos anidados y el ERD es relacional. Por ejemplo: `eventos` con `tipo`, `ambiente.novedades[]`, `inmueble.fotos[]`, `estadoElementos`, `servicio.periodos{año}` y el precio dentro del tipo de bien.
2. **Redundancias y campos obsoletos.** Contradicen reglas del ERD: copias de datos derivables, referencias que el ERD declara excluyentes, una unidad constante y marcas sustituidas por registros propios.

## Comportamiento requerido

**Prioridad absoluta:** el ajuste es transparente. La interfaz, los textos, las interacciones, los flujos y los cálculos no cambian.

La fase 1 elimina redundancias y campos obsoletos, y alinea valores y relaciones sin cambiar la forma de las colecciones. Las extracciones a colecciones propias se planifican por fases (ver más abajo).

| # | Ajuste | Regla del ERD | Cambio |
| --- | --- | --- | --- |
| 1 | Consumo declarado derivado | `SGR_COMBUSTIBLE`, `MOV-04` | Se retira `itinerario.consumoDeclaradoL`. `consumoDeclaradoL(itinerarioId)` (`services/combustible.js`) lo deriva del consumo vigente, así que ya no hay copia que sincronizar al registrar, corregir, anular o reactivar. |
| 2 | Referencias excluyentes del combustible | `CK_MOV_COM_TIPO_OBJETIVO` | Un `consumo` ya no guarda `vehiculoId`: `vehiculoDeRegistro(r)` lo obtiene del itinerario. Al corregir el tipo, la referencia cambia de vehículo a itinerario o al revés. |
| 3 | Unidad obsoleta | `CANT_LITRO` | Se retira `unidad: 'L'` de vehículos y registros de combustible. La interfaz muestra «litros», igual que antes. |
| 4 | Atención como única marca | `SGR_ATENCION` | Se retira `atendida`. `estaAtendida(registro)` (`services/datos.js`) equivale a tener `atencion` registrada. |
| 5 | Incidencias semilla con el formato vigente | `SGR_INCIDENTE`, `SGR_BIEN_IMPLICADO` | Las incidencias de `eventos.json` incluyen `origen`, `carId`, `requiereEvaluacion` y la decisión `requiereReposicion` por bien. Se retiran la marca global `reportaNecesidad` y su respaldo en `requiereReposicion`, y el respaldo `e.unidades`, que no tenía escritor. |
| 6 | Hechos de servicio con identidad | `SGR_HECHO` | Los hechos semilla tienen `id` (`HS-001`…) e `informadoPor`, como los que se registran en la aplicación. |
| 7 | Condición no constatable | `SGR_BIEN.ID_CONDICION` | **Ajuste justificado del ERD (7.1.0).** La columna pasa a admitir `NULL`, porque la aplicación muestra a propósito «No constatable» para un bien sin condición conocida, como el bien robado `AMA-SEA-TV01`. |

**Se conservan de forma deliberada**, para no cambiar el comportamiento:

- **`contextoOrigen` y `unidades` de las incidencias semilla.** Hoy se calculan en vivo a partir del ambiente y del bien. Si se guardaran, editar después el módulo o la cantidad cambiaría lo que muestra la edición del hecho.
- **`carId` de los mantenimientos de bien y de vehículo**, que el ERD declara excluyentes (`CK_CTR_MAN_OBJETIVO`).
  - Si se derivara del vehículo, sus controles pasarían al centro nuevo al reasignarlo (`VehiculoDialog`), cuando hoy se quedan en el anterior.
  - Queda para la fase siguiente, con la decisión funcional que requiere.

## Correspondencia mock ↔ ERD

**Convenciones** (no son inconsistencias):

- camelCase ↔ `MAYUSCULAS_SNAKE`.
- El id de texto es el código estable (`CODIGO`, `ROTULO`).
- Los códigos de catálogo van en minúscula: `bueno` ↔ `SGR_CATALOGO` (`CONDICION`, `BUENO`).
- `periodicidad: 'mensual'` ↔ `CANT_MES_PERIODICIDAD = 1`.
- `HH:MM` ↔ minutos desde medianoche.
- `'YYYY'`/`'YYYY-MM'` ↔ `FEC_*` + `PRECISION_ADQ`.
- `anulacion` ↔ `ESTADO`, `ELIMINADO` y `USU_/FEC_ELIMINA`, `MOTIVO_ELIMINA`.
- `informadoPor` y `registradoEl` ↔ `USU_REGISTRA` y `FEC_REGISTRA`.

**Colecciones:**

| Colección / clave | Entidad / columna |
| --- | --- |
| `cars[]`, `inmueble.*` | `SGR_CENTRO` (`DIRECCION`, `CONDICION_INMUEBLE`, `ARRENDADOR`, `FEC_FIN_CONTRATO`, `REFERENCIA_FUNDACION`, `MATERIAL`, `CANT_EXTINTOR_REQUERIDO`…) |
| `inmueble.fotos[]`, `bien.fotos[]` | `SGR_FOTO` (arco `ID_CENTRO` / `ID_AMBIENTE` / `ID_BIEN`) |
| `estadoElementos{}`, `elementosAdicionales[]` (centro, módulo, ambiente) | `SGR_ELEMENTO` + `SGR_CATALOGO` (`ELEMENTO_BASE`) |
| `modulos[]` | `SGR_MODULO` |
| `ambientes[]` | `SGR_AMBIENTE`. `carId` es un dato derivable del módulo. |
| `ambiente.intervenciones[]` | `SGR_INTERVENCION` |
| `ambiente.novedades[]` + `atencion` | `SGR_INCIDENTE` (`CLASE = NOVEDAD`) + `SGR_ATENCION` |
| `bienes[]`, `asociadoA` | `SGR_BIEN` (`ID_PRINCIPAL_BIEN`, `POSICION_COMPONENTE`) |
| `verificacionDe(bien)`, `situacionDe(bien)`, `revisionPendienteDe(bien)` | Derivados del ERD: `SGR_HISTORIAL_BIEN`, `SGR_BAJA`, `SGR_BIEN_IMPLICADO.RESOLUCION` |
| `inventarioPrevio[]` | `SGR_INVENTARIO_PREVIO` |
| `tiposBien[]` (`precio`, `historial`) | `SGR_CATALOGO` (`TIPO_BIEN`) + `SGR_PRECIO` |
| `eventos[]`, por tipo | Incidencia: `SGR_INCIDENTE` + `SGR_BIEN_IMPLICADO` (`AFECTADO`)<br>`baja`: `SGR_BAJA` + `COMPONENTE`<br>`reposicion`: `SGR_REPOSICION` + `REASIGNADO`<br>`verificacion`, `condicion`, `asociacion`, `traslado`: `SGR_HISTORIAL_BIEN` |
| `mantenimientos[]` | `SGR_MANTENIMIENTO` |
| `servicios[]`, `periodos{}`, `hechos[]` | `SGR_SERVICIO`, `SGR_PERIODO`, `SGR_HECHO` |
| `vehiculos[]` (`chofer`, `mantenimiento{}`) | `SGR_VEHICULO` (`CHOFER_REFERENCIA`, `MOTIVO_MANTENIMIENTO`, `MONTO_MANTENIMIENTO`) |
| `itinerarios[]` (`previsto`, `realizado`, `destinos`, `ruta`) | `SGR_ITINERARIO`: `MIN_*`, `*_REAL`, `EJECUTADO`, `DESTINOS`, `*_RUTA` |
| `combustible[]` | `SGR_COMBUSTIBLE` |
| `config/perfiles.js` | `SGR_PERFIL`, `SGR_PERMISO`, `SGR_PERFIL_PERMISO`, `SGR_USUARIO_PERFIL` |

## Fases siguientes

Cada fase tendrá su propia spec y la misma garantía de UI.

1. **Centros** — hecha en la [SPEC 033](033-mocks-centros-relacionales.md):
   - fotos en una colección con arco;
   - elementos evaluados como filas;
   - intervenciones;
   - novedades como incidentes de clase `NOVEDAD`.
2. **Inventario** — hecha en la [SPEC 034](034-mocks-inventario-derivado.md):
   - historial estructurado con resultado de verificación y condiciones anterior y nueva;
   - situación, verificación y revisión pendiente derivadas de los hechos.
3. **Incidencias:** baja, reposición con referencia a su baja y bienes implicados por rol.
4. **Planificación:**
   - precios con historial propio;
   - `carId` exclusivo del mantenimiento, una vez decidido qué ocurre al reasignar un vehículo.
5. **Servicios:** períodos como filas, con la periodicidad informada.
6. **Movilidad:** `destinos` y `ruta.puntos` unificados.
7. **Transversal:** `ambiente.carId` derivado del módulo.

## Verificación autorizada

- **Recorrido de solo lectura:** se capturó el texto visible de 23 pantallas con 4 perfiles (92 capturas) antes y después del cambio, con 0 diferencias. La línea base se repitió para confirmar que era estable.
- **Flujos de escritura**, ejecutados con el mismo guion sobre el código original y el nuevo (22 capturas, 0 diferencias):
  - informar una ejecución;
  - declarar, anular, reactivar y corregir un consumo;
  - cambiar un consumo a carga;
  - atender una novedad;
  - registrar una incidencia.
- `npm run build` sin errores y consola del navegador sin errores.
- ERD: `validateModel(expandModel(modelo))` sin errores. `git diff --check`.
