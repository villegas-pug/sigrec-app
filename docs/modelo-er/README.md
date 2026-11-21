# SIGREC · Modelo entidad-relación Oracle

El visor documenta el modelo relacional de la operación de los Centros de Acogida Residencial. La [fuente canónica](data/modelo.json) contiene el diccionario, las restricciones, las cardinalidades, las reglas de negocio y su trazabilidad al prototipo. La aplicación estática lee ese archivo al abrirse.

## Uso local y publicación

Desde la raíz Git, inicia el servidor HTTP estático con Node.js y npm:

~~~powershell
npm --prefix docs/modelo-er start
~~~

Abre [http://127.0.0.1:8080/](http://127.0.0.1:8080/). Pulsa **Ctrl+C** en la terminal cuando quieras detener el servidor.

La vista ejecutiva muestra las entidades principales y la vista técnica presenta tarjetas compactas con acceso al diccionario. La **Vista completa** abre al 100 % y muestra en el lienzo todas las columnas, tipos Oracle, PK, FK y nulabilidad. En esta vista, buscar un campo centra y resalta su fila. Usa **/** para buscar, **+** y **−** para el zoom y las flechas para desplazarte con el lienzo enfocado. Para moverte horizontalmente, también puedes usar **← / →** debajo del lienzo, **Mayús + rueda**, arrastrar el fondo con el ratón o deslizarlo en una pantalla táctil.

Pulsa **Pantalla completa** junto al título para ampliar el lienzo. La búsqueda y los filtros siguen disponibles. El panel lateral se abre con **Diccionario** o al consultar una tabla. Pulsa **Salir** o **Esc** para volver a la vista normal.

Para mover una tabla, arrastra su tarjeta con el ratón o usa el asa de puntos en una pantalla táctil. Para mover un módulo entero, arrastra su encabezado. Con la tarjeta o el encabezado enfocados, **Mayús + flechas** también permite moverlos.

- **Ajustar** encuadra la distribución visible y cambia el zoom.
- **Lectura 100 %** recupera el tamaño de lectura en la Vista completa.
- **Distribuir grupos** aprovecha el espacio disponible y conserva la posición relativa de las tablas en cada módulo.
- **Restablecer distribución** vuelve al orden automático de la vista actual. Las posiciones se guardan mientras el visor está abierto y se conservan al entrar y salir de pantalla completa.

Selecciona una tabla para destacar sus conexiones. Pasa el cursor por una línea o selecciónala para identificar sus extremos y cardinalidades. La sección **Relaciones** del detalle ofrece la misma selección con el teclado. `0..1` significa cero o uno, `1..1` exactamente uno y `0..N` cero o más. Cuando corresponde, el detalle indica si el máximo aplica solo a filas vigentes.

En **Vista completa**, la columna Cardinalidad muestra hijos por padre / padres por hijo junto al campo FK. `†` indica que el límite de hijos cuenta las filas vigentes. Haz clic en la cardinalidad o en la línea visible para resaltar las dos columnas vinculadas. Los campos de auditoría siempre se incluyen. Activa **FK de auditoría** para añadir sus cardinalidades y conexiones.

**Reglas y cobertura** muestra las fuentes y clasifica cada regla como observada, provisional o propuesta. **Descargar SVG** e **Imprimir / PDF** incluyen la distribución completa de la vista filtrada, independientemente del zoom. La impresión técnica de todos los módulos añade páginas por módulo.

Para imprimir las tablas con sus campos, selecciona **Vista completa** y pulsa **Imprimir / PDF**. La salida se encuadra en una sola lámina **A3 horizontal**. Selecciona **Todos los módulos** para imprimir el modelo global o filtra un módulo para leer los campos con mayor tamaño. El diálogo del navegador permite imprimir o guardar como PDF.

Para publicar desde la carpeta `docs` de la rama que elijas en GitHub Pages, la entrada será `modelo-er/`. Si publicas esta carpeta como raíz del sitio, la entrada será `index.html`. Las rutas de los recursos son relativas en ambos casos. Los nombres de archivo del diccionario y sus carpetas deben conservarse al copiar el visor.

## Contrato de datos

| Campo del JSON | Uso |
| --- | --- |
| `schemaVersion`, `platform` | Versión del contrato, prefijo Oracle `SGR_`, convenciones, vigencia y codificación de fechas. |
| `modules`, `tables` | Agrupaciones del visor y diccionario físico. `executive` habilita una tabla o FK en la vista ejecutiva. `junction` designa las dos FK que representan los extremos de una asociación. |
| `common` | Columnas obligatorias, PK, `CHECK`, FK de auditoría e índices reutilizados en todas las tablas. En cada tabla, sustituir `{alias}` por el `alias` declarado en sus plantillas. `deferrableOn` identifica la excepción de arranque del actor técnico. |
| `foreignKeys` | Extremo hijo en la tabla declarante y padre en `references.table`. `cardinality.from` cuenta padres por hijo. `cardinality.to` cuenta hijos por padre. `cardinalityScope: "VIGENTE"` aplica el máximo a hijos vigentes. |
| `uniqueKeys`, `checks`, `indexes` | Claves únicas, predicados de fila e índices explícitos. La PK y cada clave única permanente tienen su índice implícito. |
| `sources`, `rules`, `processes`, `profileExamples` | Procedencia, evidencia y modo de aplicación de las reglas, cobertura por pantalla y permisos provisionales de los perfiles. |

Para un índice `uniqueFunctional`, aplica `transforms` de izquierda a derecha sobre cada columna indicada. Con el mismo `predicate` en todas las posiciones, la expresión entrega el valor transformado únicamente si se cumple la condición. `whenNotNull` agrega condiciones de presencia al predicado completo. Fuera de la condición, todas las expresiones devuelven `NULL`, lo que permite conservar varias filas históricas. Los fragmentos de `checks` e índices describen restricciones para una generación futura a partir del JSON. [Oracle 19c · CREATE INDEX](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-INDEX.html)

La ficha del inmueble vive en el centro. Las cifras de Inicio, necesidades, avisos, inventario consolidado y simulación se derivan de sus registros de origen. Los datos históricos con fecha parcial conservan su granularidad. La identidad se propone mediante un proveedor externo y un actor de auditoría local. Las fotografías admiten metadatos históricos sin imagen y el modelo propone un BLOB para contenido nuevo. Las reglas de pólizas, expedientes de NNA, ejecución de pagos y aprobación de compras quedan fuera del dominio documentado por el prototipo. [Alcance del prototipo](../spec/001-prototipo-sigrec.md) · [Ficha y estado operativo](../spec/010-fichas-planificacion-y-estado-operativo.md)

Desde la versión `2.0.0`, los nombres Oracle usan `SGR_ENTIDAD` o `SGR_PADRE_HIJO` para asociaciones. Ejemplos: `SGR_CENTRO`, `SGR_VEHICULO` y `SGR_PERFIL_PERMISO`. Las restricciones e índices conservan su alias técnico.

## Consolidación del modelo en 4.0.0

El modelo pasa de **44 a 42 tablas**. Tres consolidaciones reducen registros y relaciones redundantes. Se recupera una tabla para conservar el historial de reposiciones. [SPEC 028](../spec/028-modelo-er-consolidation.md)

| Cambio | Justificación e integridad |
| --- | --- |
| Novedades e incidencias en `SGR_INCIDENTE` | Comparten título, fecha, tipo y contexto. `CLASE` conserva la diferencia entre ambos flujos y el `CHECK` exige origen de ambiente para novedades. `SGR_ATENCION` tiene una FK obligatoria y admite una sola atención vigente por hecho. |
| Cargas y consumos en `SGR_COMBUSTIBLE` | Una fila conserva código, autor, fecha, litros y sustento. El tipo exige exactamente una referencia válida. La carga indica vehículo y el consumo indica ejecución. Un índice único funcional impide dos consumos vigentes de una ejecución. |
| Periodicidad en meses | Servicio y período guardan respectivamente la configuración actual y la duración con que se informó el período. Los `CHECK` validan las seis duraciones y limitan el ordinal. Los hechos siguen vinculados al período original aunque cambie la configuración. |
| Historial en `SGR_REPOSICION` | La reversión conserva la fecha, el detalle, el reemplazo y los componentes reasignados que consulta el visor de incidencias. Se reutiliza `SGR_BIEN_IMPLICADO` para registrar esos componentes. |

Los catálogos de condición y tipo de servicio conservan sus códigos y FK. También se conservan los registros con historial o ciclo de vida propio, como las atenciones, los períodos y sus hechos, la ejecución del itinerario y los precios referenciales. Las reglas del JSON distinguen las restricciones de fila y unicidad de las validaciones que requieren una transacción futura, como confirmar el ámbito de combustible, validar afectados y revertir una reposición junto con las reasignaciones.

## Catálogo único en 5.0.0

El modelo pasa de **42 a 37 tablas**, mantiene los siete módulos y deja «Centros e infraestructura» en siete tablas. [SPEC 029](../spec/029-modelo-er-catalogo-unico.md)

| Cambio | Justificación e integridad |
| --- | --- |
| `SGR_CATALOGO` | Reúne las listas de condición física, elementos base, tipos de incidencia, de mantenimiento y de servicio, y categorías de bien. `DOMINIO` identifica la lista y la clave única `(DOMINIO, CODIGO)` admite códigos repetidos entre listas. Las FK consumidoras conservan su nombre y apuntan a `SGR_CATALOGO.ID`. La regla `CTR-09` documenta que la aplicación valida el dominio. |
| `SGR_ATENCION` en «Incidencias y patrimonio» | Su único padre es `SGR_INCIDENTE`; la tabla no cambia. |
| `SGR_MANTENIMIENTO` en «Necesidades y presupuesto» | Abarca centros, bienes y vehículos, y programa el siguiente control. |

Perfiles y permisos siguen como entidades de autorización. Las enumeraciones resueltas con `CHECK` se conservan porque las reglas condicionales comparan sus literales.

## Validación y aceptación

La verificación estática del visor valida nombres, tipos, auditoría, claves, destinos, índices, cardinalidades, catálogos y referencias. El módulo [model.js](js/model.js) expone `expandModel` y `validateModel` para revisar el JSON con un consumidor local. Cada columna que admite `NULL` declara su motivo. Las reglas de más de una fila indican la frontera transaccional para una futura implementación.

Los siguientes escenarios quedan definidos para una validación funcional autorizada.

| Escenario | Resultado esperado |
| --- | --- |
| Abrir el visor desde la raíz y desde una ruta prefijada | Carga del JSON y renderizado de ambas vistas. |
| Buscar `FEC_ADQUISICION` o una tabla por su nombre visible | Apertura del detalle correcto, con el atributo de destino resaltado cuando corresponda. |
| Filtrar un módulo y seleccionar una entidad, también con teclado | Conteo consistente con la vista y resaltado de sus relaciones visibles. Las demás FK se pueden consultar en el panel. |
| Arrastrar una tabla con ratón, tacto o Mayús + flechas | Sus conexiones siguen a la tarjeta. El desplazamiento se conserva al cambiar filtros y zoom. Restablecer o recargar recupera el orden automático. |
| Mover un módulo y pulsar Distribuir grupos | El encabezado y las tablas se desplazan juntos. La distribución deja espacio entre módulos y conserva el orden interno de sus tablas. |
| Entrar y salir de pantalla completa en escritorio y móvil | Se conservan las posiciones y el filtro. El diccionario se puede abrir o cerrar y **Esc** permite volver a la vista normal. |
| Seleccionar una línea o activarla desde el listado de relaciones | Ambos extremos quedan resaltados y muestran su cardinalidad. Las relaciones con unicidad entre filas vigentes explican ese alcance en el detalle. |
| Abrir Vista completa y buscar un campo | Se muestran sus tipos, claves y nulabilidad dentro de cada tabla. La búsqueda enfoca la fila y la selección de una FK resalta las dos columnas relacionadas. |
| Imprimir Vista completa general o de un módulo | Una sola página A3 horizontal con título, leyenda y todas las tarjetas y relaciones visibles. |
| Alternar las FK de auditoría y abrir un índice funcional | Distinción de relaciones de auditoría y expresión de unicidad condicional legible. |
| Consultar un ambiente con una novedad y una incidencia | La novedad conserva su ubicación y atención. Solo la incidencia admite afectados. El indicador de novedades abiertas y la evaluación de infraestructura mantienen sus filtros. |
| Corregir una carga como consumo y luego anularlo | Conserva código y autor, usa el vehículo de la ejecución y se rechaza si ya existe un consumo vigente. Tras anularlo, la ejecución admite otra declaración. |
| Cambiar un servicio de bimestral a mensual cuando esté habilitado | Los hechos anteriores conservan sus períodos bimestrales. El ordinal 7 es inválido en un período bimestral y válido en uno mensual. |
| Revertir una reposición y registrar otra para la misma baja | La primera queda consultable como anulada con su reemplazo y sus componentes. Solo la segunda es vigente. La baja puede revertirse cuando ya no tenga reposición vigente. |
| Usar el visor a 360 px y a ancho de escritorio | Panel, controles y diálogo legibles. La lista permite navegar sin manipular el diagrama. |
| Exportar después de acercar y desplazar el lienzo | SVG con toda la selección y vista de impresión completa, con páginas por módulo en la vista técnica general. |
