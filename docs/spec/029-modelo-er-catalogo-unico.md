# SPEC 029 — Modelo ER: centros en siete tablas y catálogo único

## Problema

En el modelo 4.0.0 (SPEC 028), el módulo «Centros e infraestructura» tiene doce tablas. Cuatro son catálogos, uno de los cuales solo usa otro módulo. Además, el módulo incluye la atención de los hechos de incidencias y el mantenimiento preventivo, que abarca centros, bienes y vehículos. Los seis catálogos de dominio del proyecto repiten la misma estructura de código, nombre y descripción.

## Comportamiento requerido

Reducir `centros` a siete tablas, manteniendo `SGR_CENTRO`, `SGR_MODULO`, `SGR_AMBIENTE`, `SGR_ELEMENTO` y `SGR_FOTO`, y conservar los siete módulos. Solo cambian el modelo ER, su validador, el detalle del visor y la documentación; la SPA no se modifica.

| Cambio | Resultado |
| --- | --- |
| Catálogo único | `SGR_CATALOGO` sustituye a `SGR_CONDICION`, `SGR_ELEMENTO_BASE`, `SGR_TIPO_INCIDENCIA`, `SGR_TIPO_MANTENIMIENTO`, `SGR_CATEGORIA_BIEN` y `SGR_TIPO_SERVICIO`. `DOMINIO` identifica la lista y `CODIGO` es único dentro de ella, porque hay códigos repetidos entre listas. `OBJETIVO` y `CANT_MES_SUGERIDO` solo se informan en `TIPO_MANTENIMIENTO`. |
| Referencias | Las FK consumidoras apuntan a `SGR_CATALOGO.ID` y conservan nombre, índice, rol y cardinalidad. La regla `CTR-09` documenta que la aplicación valida el dominio en la misma transacción. |
| Atención | `SGR_ATENCION` pasa a `incidencias`, junto a su único padre, `SGR_INCIDENTE`. La tabla no cambia: sigue siendo auditable, como establece la SPEC 028. |
| Mantenimiento | `SGR_MANTENIMIENTO` pasa a `planificacion`. Su objetivo es un centro, un bien o un vehículo, y programa el siguiente control. |
| Fuera de alcance | `SGR_PERFIL` y `SGR_PERMISO` siguen como entidades de autorización. Las enumeraciones `CHECK IN` se mantienen porque las reglas condicionales comparan sus literales. |

Las reglas `CTR-06` y `CTR-07`, y el proceso `mantenimiento`, pasan a `planificacion`; `CTR-08` pasa a `incidencias`. Todos conservan su identificador. El contrato pasa a la versión 5.0.0, con 37 tablas.

## Riesgos aceptados

- Oracle comprueba que el valor exista, pero no que pertenezca al dominio esperado. Esa validación queda a cargo de la transacción (`CTR-09`).
- Las columnas propias de mantenimiento quedan nulas en los demás dominios; un `CHECK` por dominio lo controla.
- Los ids de regla con prefijo `CTR-` pueden quedar en otro módulo, para conservar la trazabilidad.

## Verificación autorizada

- `validateModel(expandModel(modelo))` devuelve una lista vacía.
- Conteos esperados: `centros` = 7, `incidencias` = 5, `planificacion` = 2.
- Ninguna referencia a los catálogos retirados.
- Comparación contra el commit previo.
- `node --check` de los JS modificados y `git diff --check`.
- La revisión visual del visor queda a cargo del usuario.
