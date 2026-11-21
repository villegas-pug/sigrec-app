# SPEC 031 — Modelo ER: movilidad en tres tablas

## Problema

En el modelo 6.0.0 (SPEC 030), el módulo «Movilidad y combustible» tiene siete tablas: `SGR_VEHICULO`, `SGR_ITINERARIO`, `SGR_PUNTO`, `SGR_RUTA`, `SGR_VERTICE`, `SGR_EJECUCION` y `SGR_COMBUSTIBLE`.

En el prototipo (`aplicaciones/sigrec/frontend/src/data/itinerarios.json`, `aplicaciones/sigrec/frontend/src/services/acciones.js`), el itinerario es un único objeto con `destinos` (arreglo ordenado), `previsto`, `realizado` y `ruta`. El consumo de combustible apunta a `itinerarioId`. La ruta y la ejecución admiten a lo sumo un registro vigente por itinerario.

## Comportamiento requerido

Reducir `movilidad` a tres tablas: `SGR_VEHICULO`, `SGR_ITINERARIO` y `SGR_COMBUSTIBLE`. Se conservan los siete módulos.

Cambian el modelo ER, el validador del visor y la documentación; la SPA no se modifica.

El contrato pasa a la versión 7.0.0, con 28 tablas.

Esta especificación reemplaza el criterio de la SPEC 028, según el cual la ruta frente a las paradas y la ejecución frente al itinerario mantenían registros propios.

| Cambio | Resultado |
| --- | --- |
| Ejecución | Pasa a `SGR_ITINERARIO`: `EJECUTADO` (0/1) y `MIN_SALIDA_REAL`, `MIN_LLEGADA_REAL`, `DISTANCIA_KM_REAL`. Los datos reales solo se informan con `EJECUTADO = 1` y siguen separados de los previstos. |
| Ruta | Pasa a `SGR_ITINERARIO`: `PROVEEDOR_RUTA`, `DISTANCIA_RUTA_M` y `GEOMETRIA_RUTA`. Se informan juntos y solo en el modo `MAPA`. |
| Puntos y vértices | Pasan a columnas `CLOB` con `IS JSON`. `DESTINOS` es un arreglo ordenado `{nombre, latitud, longitud}`, en el que el retorno repite un punto. `GEOMETRIA_RUTA` es un arreglo ordenado de pares `[longitud, latitud]`. |
| Combustible | `ID_EJECUCION` pasa a ser `ID_ITINERARIO`, y un índice único funcional admite un solo consumo vigente por itinerario. |
| Validador | `ORACLE_TYPE` admite `CLOB`. |
| Reglas | La nueva regla `MOV-07` documenta la estructura JSON y la equivalencia «ejecución = `EJECUTADO = 1`». Las reglas `MOV-02` a `MOV-06` y los procesos `itinerarios` y `combustible` citan `SGR_ITINERARIO` y conservan su texto. |

## Correspondencia

| Antes | Después |
| --- | --- |
| Fila vigente de `SGR_EJECUCION` | `SGR_ITINERARIO.EJECUTADO = 1` |
| `SGR_EJECUCION.MIN_SALIDA`, `MIN_LLEGADA`, `DISTANCIA_KM` y sus CHECK | `*_REAL` y `CK_MOV_ITI_*_REAL` |
| `IX_MOV_EJE_ITINERARIO`, `IX_MOV_RUT_ITINERARIO` | Innecesarios: el dato vive en la fila del itinerario |
| `SGR_RUTA.PROVEEDOR`, `DISTANCIA_M` | `PROVEEDOR_RUTA`, `DISTANCIA_RUTA_M` |
| `SGR_VERTICE` (`UK_MOV_VER_ORDEN` y CHECK de coordenadas) | `GEOMETRIA_RUTA`, validada por `MOV-07` |
| `SGR_PUNTO` (`IX_MOV_PUN_ORDEN` y CHECK de coordenadas) | `DESTINOS`, validada por `MOV-07` |
| `SGR_COMBUSTIBLE.ID_EJECUCION`, `FK_MOV_COM_MOV_EJE`, `IX_MOV_COM_EJE_VIG`, `IX_MOV_COM_MOV_EJE` | `ID_ITINERARIO`, `FK_MOV_COM_MOV_ITI`, `IX_MOV_COM_ITI_VIG`, `IX_MOV_COM_MOV_ITI` |

## Riesgos aceptados

- **Auditoría de la ejecución:** la ejecución pierde su auditoría y su anulación propias. Corregir lo realizado actualiza el itinerario, igual que el prototipo sobrescribe `realizado`.
- **Puntos y vértices sin control de Oracle:** Oracle ya no controla el rango de cada coordenada, el orden único ni el par latitud/longitud. Esas validaciones pasan a la transacción (`MOV-07`), y consultar o indexar por punto requiere funciones JSON.
- **Consumo de un itinerario no ejecutado:** que el consumo exija un itinerario ejecutado se valida en la transacción.

## Verificación autorizada

- `validateModel(expandModel(modelo))` devuelve una lista vacía.
- Conteos esperados: `movilidad` = 3, total = 28.
- Ninguna referencia a las tablas retiradas en `aplicaciones/sigrec/database/modelo-er/`.
- Comparación contra la versión 6.0.0: solo cambian `SGR_ITINERARIO`, `SGR_COMBUSTIBLE`, las reglas `MOV-02` a `MOV-07` y los procesos `itinerarios` y `combustible`.
- `node --check` de `model.js` y `git diff --check`.
- La revisión visual del visor queda a cargo del usuario.
