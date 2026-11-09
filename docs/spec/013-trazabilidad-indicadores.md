# SPEC 013 — De la cifra a los registros

- **Fecha:** 2026-11-09
- **Estado:** Tres olas implementadas después de especificar el contrato. Verificación funcional pendiente de autorización.

## Contract

Un enlace de resumen identifica el mismo conjunto, ámbito, año y unidad que su cifra. Un acceso nuevo aplica su consulta; el historial restaura la entrada visitada. Se reutilizan permisos y reglas de negocio. No hay backend ni persistencia adicional.

| Origen | Unidad | Filtro y destino | Retorno |
| --- | --- | --- | --- |
| Bienes verificados | Registros activos | Inventario `vista=detalle&verificacion=registrada` | Ficha → lista con filtros y selección |
| Bienes activos / deteriorados | Unidades | Inventario detalle / `vista=mal_estado`, `car`, `tipo` | Ficha → lista |
| Equipo por centro | Unidades / controles | Inventario detalle con `car`, `tipo`, `control=vencido` o mal estado | Ficha → consulta |
| Vehículos con atención | Vehículos vigentes | Vehículos `estado=con_atencion`, `car` | Conserva filtros |
| Recorridos | Recorridos vigentes | Itinerarios `vista=ambito`, `car` | Recorrido → lista con selección |
| Controles vencidos | Controles | Inicio `aviso=control_vencido`, `car`, ancla Atención | Registro → avisos filtrados |
| Servicios | Períodos / servicios / renovaciones | Servicios `alerta=pendiente|interrupcion|renovacion|recurrente|sin_info`, `car`, `anio` | Servicio/período → lista |
| Infraestructura | Ambientes / elementos | Centros `consulta=ambientes_criticos|elementos_criticos|novedades`, `car` | Ficha → lista |
| Necesidades | Necesidades / novedades / reposiciones | Necesidades `vista=sin_valorar|infraestructura|atendidas`, `car`, `anio` | Detalle → lista |

## Implementation

- Destinos por alerta en la matriz, además del acceso general. Mensajes sin resultados no enlazan.
- Listas con identidad, ubicación, cantidad o unidad explícita, filtro visible, vacío y acceso al registro exacto. Tablas/tarjetas existentes se conservan; las consultas nuevas usan tarjetas adaptables.
- Selección común de bienes activos de centros y ambientes vigentes; componentes independientes de la situación del principal.
- CSV de cada vista de Inventario corresponde a sus filas actuales. Monto del simulador conservado en historial y acceso a ficha desde cada fila.
- Las secciones auxiliares de Necesidades explican cuando no siguen el filtro por tipo.
- No se modifican permisos ni los enlaces profundos existentes de Incidencias, Combustible o buscador.

## Acceptance

- Coincidencia de conjuntos y sumas entre origen y destino; distinguir registros, unidades, controles y períodos.
- Ámbitos múltiples/restringidos, componentes, cantidades mayores a uno, bajas, anulaciones de ambientes, vacíos, sin valoración y sin verificación.
- Acceso directo, filtros previos, recarga, Atrás/Adelante, retorno con selección, teclado y móvil; CSV equivalente a vista.
- Estado de todos los recorridos: pendiente de validación funcional. Solo se ejecutan comprobaciones estáticas sin autorización adicional.

## Validation

| Recorrido | Implementación | Validación funcional |
| --- | --- | --- |
| Verificados / sin registro / bienes activos | Detalle, filtros explícitos, ficha y selección persistida | Pendiente |
| Mal estado por ámbito, centro y tipo | Se conserva SPEC 012, con selección común de bienes activos | Pendiente |
| Vehículos con atención y estados por centro | Filtro de estado en enlace profundo | Pendiente |
| Recorridos de todo el ámbito | Consulta con centro y vehículo identificados | Pendiente |
| Controles vencidos / por vencer / dotación faltante | Clasificación estable; filtro y horizonte correspondiente | Pendiente |
| Servicios por clase de alerta | Períodos individuales o servicios según unidad del indicador | Pendiente |
| Ambientes / elementos críticos / novedades | Consulta con identificación del inmueble o ambiente | Pendiente |
| Consulta por equipo | Accesos por tipo en tabla y tarjetas; CSV propio | Pendiente |
| Necesidades sin valorar / infraestructura / atendidas | Vista seleccionable, exportación y retorno | Pendiente |
| Simulador → ficha → simulador | Monto, selección y filtros conservados | Pendiente |
| Incidencias, avisos individuales, Combustible y buscador | Destinos existentes conservados; revisión de sus contratos | Pendiente de regresión |

- Revisión estática de sintaxis JavaScript, estructura Vue, expresiones de plantillas e imports/exports locales: sin errores en los 21 archivos de código modificados o añadidos.
- El retorno admite lista → ficha dentro de la misma ruta. La consulta de infraestructura usa desplazamiento normal; el explorador conserva su disposición anterior.
- Los centros restaurados del historial se intersectan con el ámbito actual antes de consultar registros. No se amplían permisos.
- No se ejecutaron pruebas, builds, servidores ni verificación en navegador. Las coincidencias de conteos, acciones y CSV reales permanecen pendientes de autorización funcional.
