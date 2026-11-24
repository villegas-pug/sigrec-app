# SPEC 052 — Filtros de cabecera y carga filtrada en el backend

Reemplaza parcialmente la SPEC 041: la caché de datos por sesión queda solo para catálogos y tipos de bien. Toma como referencia visual los filtros de `sigeif-app` (`pages/GestionFamilias.vue`).

## Problema

Cada pantalla filtraba a su manera (Centro, Período, Año…) sobre colecciones completas cargadas una sola vez por sesión. Con el tiempo la caché muestra datos desactualizados y cada pantalla trae todo de una sola llamada.

## Decisiones

### Barra de filtros
- Las migas, el enlace a Inicio y el título centrado aparecen antes de los filtros. Las acciones permanecen debajo; el explorador descuenta la altura del encabezado y los filtros.
- Tipo de Entidad y Entidad ocupan la primera fila; Centro, Año y Mes ocupan todo el ancho de la segunda, con mayor espacio para Centro. En pantallas estrechas los campos se adaptan al ancho disponible.
- Un componente compartido, `components/layout/FiltrosCabecera.vue`, que `MainLayout` muestra sobre la pantalla cuando la ruta declara `meta.filtros`. No aparece en Inicio, Manual, Sin acceso ni la raíz.
- Campos, en este orden:
  1. **Tipo de Entidad**: fijo, «PÚBLICA» (solo informativo, como en la referencia).
  2. **Entidad**: fija, «PROGRAMA INTEGRAL NACIONAL PARA BIENESTAR FAMILIAR - INABIF».
  3. **Centro**: campo de solo lectura con lupa (abre el buscador) y `cancel` (vuelve a todos los centros). No existe «Servicio».
  4. **Año**: «Todos» y los años de 2026 al año actual; la lista crece sola cada año.
  5. **Mes**: «Todos» y enero–diciembre. Deshabilitado, y en «Todos», mientras Año sea «Todos».
- Valores iniciales: todos los centros del ámbito, Año «Todos», Mes «Todos».
- Estado global en memoria (`composables/useFiltrosCabecera.js`): se conserva al navegar entre pantallas, se reinicia al cambiar de sesión y se pierde al recargar el navegador. No va en la URL, para no volver a montar la pantalla (`:key="route.fullPath"`).
- Un enlace profundo con `?car=` fija el centro de la cabecera al entrar en una pantalla con filtros.
- Los filtros se aplican al instante, sin botón «Consultar». Mientras llega la respuesta la pantalla sigue montada y muestra una barra de progreso.

### Buscador de centros
- Diálogo `components/centros/CentroBuscadorDialog.vue`, con el mismo comportamiento que el de unidades orgánicas (SPEC 045): mínimo tres caracteres, espera de 400 ms, cinco filas por página y descarte de respuestas antiguas.
- Columnas: Código, Nombre, Unidad orgánica, Dirección y Selección.
- `GET /api/v1/centros/buscar?q&pagina` busca sin distinguir tildes por código o nombre del centro, solo entre los centros vigentes del ámbito del usuario. No exige un permiso de acción.
- La lógica común de búsqueda paginada vive en `composables/useBusquedaPaginada.js`, compartida con `UnidadOrganicaSelector.vue`.

### Filtrado en el backend
- Las colecciones aceptan `?centro=&anio=&mes=` (`shared/model/FiltroConsulta`). Año y Mes se aplican a la **fecha de registro** (`FEC_REGISTRA`) del registro principal de la pantalla, en el rango semiabierto del periodo, y siempre dentro del ámbito del usuario.
- `mes` sin `anio`, un mes fuera de 1–12 o un centro con formato inválido devuelven 400. Un centro fuera del ámbito devuelve una colección vacía.
- Cada ruta declara `meta.filtros: { principal: '<grupo>', registro?: '<tipo>' }`. Todos los grupos reciben `centro`; solo el principal recibe `anio`, `mes` y, si existe, `registro`.
- `registro=CENTRO` (Gestión de centros) envía el periodo a **todos** los grupos: `centro/service/FiltroCentros` lo traduce en los centros registrados en el periodo, y cada colección queda acotada a esos centros. Así ninguna colección referencia un centro que la jerarquía no trae.

| Pantalla | Año/Mes sobre | `meta.filtros` |
|---|---|---|
| Incidencias | hecho | `{ principal: 'inventario', registro: 'HECHO' }` |
| Gestión de centros | centro dueño de cada registro | `{ principal: 'jerarquia', registro: 'CENTRO' }` |
| Necesidades, Inventario | bien e inventario previo; llegan solo los hechos cuyos bienes están en la respuesta (y los de ambiente, sin bienes) | `{ principal: 'inventario', registro: 'BIEN' }` |
| Servicios | servicio | `{ principal: 'servicios' }` |
| Vehículos | vehículo | `{ principal: 'vehiculos' }` |
| Itinerarios | itinerario | `{ principal: 'itinerarios' }` |
| Combustible | registro de combustible | `{ principal: 'combustible' }` |

- Las pantallas leen el centro con `composables/useCentroCabecera.js` (`carId`, `car`, `carIdsVisibles`); asignar `carId` cambia el filtro de cabecera y recarga la pantalla. Reemplaza a `useCentroSeleccionado`.
- Servicios muestra su calendario para un solo centro: sin centro en la cabecera pide elegirlo. Un enlace `?servicio=` sin centro fija el centro del servicio.

### Carga de datos
- `services/cargaDatos.js` solo guarda en caché `catalogos` y `tiposBien[:precios]`. Los demás grupos se piden cada vez que se entra en la pantalla o cambian los filtros; un contador descarta las respuestas que ya no corresponden.
- Los grupos de una pantalla se aplican **juntos** cuando han llegado todos: ninguna vista ve, por ejemplo, la jerarquía de un centro con los hechos de otro.
- Las recargas tras guardar (`cargarInventario`) repiten la última consulta filtrada del grupo.
- Inicio no cambia: sigue con `GET /inicio/resumen` (SPEC 044).

### Filtros propios de cada pantalla
- Se retiran el Centro local de cada pantalla (también en las consultas de infraestructura, alertas de servicios y recorridos) y el Período de Incidencias: los cubre la cabecera.
- Itinerarios y Combustible conservan el selector de vehículo, que ofrece solo los vehículos del centro filtrado.
- El explorador de Gestión de centros descuenta la altura de la barra (`--sg-filtros-alto`).
- Se mantiene «Año a revisar» (Necesidades e Inventario, es un año de proyección). Servicios usa el año de cabecera para el calendario y para filtrar por fecha de registro; con «Todos» muestra los calendarios de los años disponibles y de los períodos registrados.

## Riesgos aceptados
- Los registros importados tienen como `FEC_REGISTRA` la fecha de importación: aparecen en el mes en que se migraron.
- Sin caché hay más peticiones; la paginación en el servidor queda como mejora posterior.
- En Incidencias, el estado de necesidad se calcula con los hechos del periodo filtrado.
- El centro y el periodo se aplican en los servicios del backend, después de la consulta por ámbito; la respuesta ya llega filtrada. Pasarlos a SQL queda como mejora junto con la paginación.
- En Vehículos el periodo acota los vehículos, pero sus itinerarios y mantenimientos llegan por centro.
- El buscador global (Ctrl+K) carga los grupos completos; al cerrarse (se desmonta, `onBeforeUnmount`), la pantalla vuelve a pedir sus datos filtrados.
- En Necesidades e Inventario con periodo, un hecho que nombra también un bien registrado fuera del periodo (p. ej. una reposición) no aparece.
- Un enlace profundo (`?hecho=`, `?servicio=`, `?vehiculo=`) a un registro fuera del centro o el periodo vigentes se muestra como «no disponible».

## Criterios de aceptación
1. La barra aparece en todas las pantallas con `meta.filtros` y no en Inicio ni en Manual.
2. El buscador encuentra centros del ámbito con tres o más caracteres, pagina y permite elegir uno; `cancel` vuelve a todos.
3. Mes está deshabilitado con Año «Todos»; los años van de 2026 al actual.
4. Cada cambio de filtro hace un `GET` con `centro`, `anio` y `mes`; volver a una pantalla vuelve a pedir sus datos, salvo los catálogos.
5. Incidencias muestra solo los hechos registrados en el centro y el periodo elegidos.
6. `?car=XYZ` fija el centro de la cabecera.

## Validación
- Revisión estática y `git diff --check`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
- Validado (con autorización) con `mvn test`, pruebas de API contra el backend en desarrollo y un recorrido con Playwright sobre el dev server con SRH simulado: barra presente en las 8 pantallas y ausente en Inicio y Manual; buscador; Mes deshabilitado; parámetros enviados por grupo; periodos sin datos; `?car=`; buscador global.
