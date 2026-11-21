# SPEC 030 — Modelo ER: inventario en tres tablas

## Problema

En el modelo 5.0.0 (SPEC 029), el módulo «Bienes e inventario» tiene ocho tablas:

- `SGR_TIPO_BIEN`, `SGR_BIEN` y `SGR_INVENTARIO_PREVIO`.
- Cinco tablas de antecedentes del bien: `SGR_VERIFICACION`, `SGR_CAMBIO_CONDICION`, `SGR_ASOCIACION`, `SGR_TRASLADO` y `SGR_TRASLADO_BIEN`.

El prototipo registra esos antecedentes en un único arreglo `eventos`, con `tipo` (`verificacion`, `condicion`, `asociacion`, `traslado`) y `bienIds` (`frontend/src/services/acciones.js`). El tipo de bien repite la estructura de código y nombre del catálogo único.

## Comportamiento requerido

Reducir `inventario` a tres tablas: `SGR_BIEN`, `SGR_INVENTARIO_PREVIO` y `SGR_HISTORIAL_BIEN`. Se conservan los siete módulos.

Solo cambian el modelo ER y su documentación. El código del visor y la SPA no se modifican.

El contrato pasa a la versión 6.0.0, con 32 tablas.

| Cambio | Resultado |
| --- | --- |
| Historial del bien | `SGR_HISTORIAL_BIEN` sustituye a las cinco tablas de antecedentes. `TIPO` distingue `VERIFICACION`, `CONDICION`, `ASOCIACION` y `TRASLADO`, y un `CHECK` por tipo exige sus columnas y anula las de los demás. Cada hecho sigue siendo una fila auditable; no se absorbe en el bien (criterio de la SPEC 028). |
| Bienes trasladados | Cada componente que acompaña un traslado tiene su propia fila `TRASLADO`, con `ID_TRASLADO` apuntando a la fila del traslado principal. Un índice único funcional `(ID_TRASLADO, ID_BIEN)` impide repetir un componente entre los acompañantes vigentes. |
| Tipo de bien | Pasa a `SGR_CATALOGO` como dominio `TIPO_BIEN`. El catálogo añade `CANT_ANIO_VIDA_UTIL` y `ID_CATEGORIA_BIEN`, una autorreferencia a la categoría sugerida; ambas columnas solo se informan en ese dominio. `NOMBRE` pasa a `VARCHAR2(180 CHAR)`. `SGR_CATALOGO` pasa a ser ejecutiva para conservar en esa vista el recorrido precio → tipo → bien. |
| Referencias al tipo | `FK_BIE_BIE_BIE_TIP`, `FK_BIE_PRE_BIE_TIP` y `FK_PLA_PRE_BIE_TIP` apuntan a `SGR_CATALOGO.ID` y conservan nombre, índice, rol y cardinalidad. `CTR-09` añade el dominio `TIPO_BIEN` para `ID_TIPO_BIEN`. |
| Reglas | La nueva regla `BIE-08` documenta el historial unificado y la agrupación de los traslados. Las reglas y procesos que citaban las tablas retiradas apuntan a `SGR_HISTORIAL_BIEN` o a `SGR_CATALOGO` y conservan su identificador. |

## Correspondencia

| Antes | Después (`SGR_HISTORIAL_BIEN`, salvo indicación) |
| --- | --- |
| `FEC_VERIFICACION`, `FEC_CAMBIO`, `FEC_ASOCIACION`, `FEC_TRASLADO` | `FEC_EVENTO` |
| `SGR_VERIFICACION.NOTA`, columnas `DETALLE` | `DETALLE` |
| `ID_COMPONENTE_BIEN`, `SGR_TRASLADO.ID_PRINCIPAL_BIEN`, `SGR_TRASLADO_BIEN.ID_BIEN` | `ID_BIEN` |
| `SGR_TRASLADO.ID_ORIGEN_AMBIENTE` | `ID_AMBIENTE` |
| `SGR_TRASLADO.ID_ANTERIOR_PADRE_BIEN` | `ID_ANTERIOR_BIEN` |
| `SGR_TRASLADO_BIEN.ID_TRASLADO` | `ID_TRASLADO`, la autorreferencia |
| `UK_BIE_TRB_PAR` | `IX_BIE_HIS_TRASLADO_BIEN`, único entre vigentes |
| `CK_BIE_ASO_PADRE` | `CK_BIE_HIS_ASOCIACION` |
| FK, índices y otros CHECK `*_BIE_VER_*`, `*_BIE_CCO_*`, `*_BIE_ASO_*`, `*_BIE_TRA_*` y `*_BIE_TRB_*` | Sus equivalentes `*_BIE_HIS_*` |
| `SGR_TIPO_BIEN` (`UK_BIE_TIP_CODIGO`, `FK_BIE_TIP_CAT_CAB`, `CK_BIE_TIP_CANT_ANIO_VIDA_UTIL`) | `SGR_CATALOGO` (`UK_CAT_CAT_CODIGO`, `FK_CAT_CAT_CAT_CAB`, `CK_CAT_CAT_CANT_ANIO_VIDA_UTIL`, `CK_CAT_CAT_TIPO_BIEN`) |

## Riesgos aceptados

- **Unicidad de los acompañantes:** «cada componente una vez por traslado» pasa de clave permanente a índice entre filas vigentes. En Oracle, una clave compuesta con `ID_TRASLADO` nulo chocaría con las demás filas del mismo bien.
- **Obligatoriedad:** la del destino del traslado y la del principal de una asociación pasa de `NOT NULL` a un `CHECK` por tipo.
- **Agrupación de los traslados:** que las filas acompañantes compartan fecha, origen y destino con el traslado principal se valida en la transacción (`BIE-08`).
- **Dominio de las referencias:** Oracle no comprueba que `ID_TIPO_BIEN` y `ID_CATEGORIA_BIEN` apunten a su dominio. Lo valida la transacción (`CTR-09`).
- **Tipo de bien en el catálogo genérico:** el tipo, administrable y con precios, queda dentro del catálogo. La vista ejecutiva muestra «Catálogo de valores» donde antes mostraba «Tipo de bien».

## Verificación autorizada

- `validateModel(expandModel(modelo))` devuelve una lista vacía.
- Conteos: `inventario` = 3, `centros` = 7, total = 32.
- Ninguna referencia a las tablas retiradas en `database/modelo-er/`.
- Comparación contra el modelo 5.0.0: solo cambian `SGR_CATALOGO`, el destino de las tres FK de tipo de bien, la nueva tabla, las reglas `BIE-01`, `BIE-02`, `BIE-04`, `BIE-05`, `BIE-07`, `BIE-08`, `INC-03`, `PLA-01` y `CTR-09`, y los procesos `bienes`, `verificacion`, `inventario` y `precios`.
- `git diff --check`.
- La revisión visual del visor queda a cargo del usuario.
