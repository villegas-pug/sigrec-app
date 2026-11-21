# SPEC 011 — Auditoría funcional: Inicio como panel único, enlaces con contexto y una sola fuente por dato

- **Estado:** Olas 1 (M1–M6), 2 (M7–M12) y 3 (M13–M16 y M18) implementadas en el prototipo. M17 (persistencia local) no se implementa por decisión del usuario: los datos siguen ficticios y en memoria. Verificación en navegador realizada el 09/11/2026 (ver §9 bis), con una excepción: la lectura real de la cámara. Ola 4 (M19–M21: escaneo en PC, «Volver» a la pantalla de origen y resaltado de la selección) implementada; su verificación en navegador está pendiente de autorización (§10). Ola 5 (M22–M27: retorno en saltos internos, tareas y pantallas sin salida) implementada; verificación en navegador pendiente (§11).
- **Fecha:** 2026-11-09
- **Origen:** auditoría funcional posterior a la SPEC 010 (P0–P4). El usuario decidió fusionar el «Tablero de control» en Inicio y mover la «Consulta por equipo» a Inventario.
- **Reemplaza:** SPEC 010 §5 (acceso al Tablero), §8 (pantalla Tablero) y §10 ítems 12, 14, 15 y 16, como se detalla abajo. En lo demás la SPEC 010 sigue vigente.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios en memoria**, cargados desde los JSON de `src/data`. No hay backend ni persistencia: los cambios se pierden al recargar (SPEC 005 §5).
- No cambian las reglas de necesidades ni los valores de la SPEC 001 §8 (9 necesidades, S/ 11 090; AMA: 3, S/ 1 300).
- «Sin valorar», «No evaluado», «No informado» y «Sin programar» nunca se presentan como cero, bueno ni al día.
- Los permisos por perfil no cambian, salvo lo que implica retirar el Tablero (§5).

## 1. Hallazgos y decisiones

| ID | Hallazgo | Decisión |
| --- | --- | --- |
| D1 | Inicio («Situación por CAR») y el Tablero («Estado por centro») tenían dos matrices por centro con columnas de servicios distintas. | Una sola matriz, «Situación por centro», en Inicio (§2). |
| D2 | Los avisos de Inicio se armaban en la página y omitían vehículos con atención y servicios recurrentes. | Fuente única `services/atencion.js` (§3). |
| D3 | Indicadores repetidos y dos sin destino. | Ocho indicadores en Inicio, todos con destino. |
| D4 | El último mantenimiento del vehículo se capturaba en su ficha y también salía de los registros. | Sale solo de los registros (§6). |
| D5 | El control de un bien se calculaba de tres formas. | `controlDeBien` único (§6). |
| E1–E6 | Enlaces que perdían el centro o caían en una pestaña que no mostraba lo prometido. | Mapa de enlaces profundos (§4). |
| M6 | Corregir una anulación exigía «Mostrar inactivos» y «Reactivar». | «Deshacer» en la notificación; contador de avisos en la cabecera (§7). |

## 2. Inicio como panel único

- **Indicadores:**
  - Centros.
  - Necesidades pendientes del año de revisión.
  - Importe conocido.
  - Controles vencidos (enlace a `#atencion`).
  - Bienes en mal estado (unidades, enlace a Inventario).
  - Bienes verificados (registros).
  - Vehículos con atención.
  - Recorridos registrados.
- **Atención requerida** (§3): pestañas **Ahora** y **Próximos 60 días**, con filtros por tema y por centro (este último cuando el ámbito tiene más de uno).
- **Situación por centro** (`services/situacion.js › resumenPorCentro`, antes `tablero.js`). Columnas:
  - Necesidades.
  - Infraestructura.
  - Novedades abiertas.
  - Bienes (unidades activas, en mal estado y verificados).
  - Controles preventivos.
  - Vehículos.
  - Servicios (pendientes, interrupciones, renovaciones, recurrentes y sin información).

  Cada celda enlaza a su detalle con el centro. En pantallas estrechas, cada centro es una tarjeta.
- **Retiro del Tablero:**
  - Se elimina `TableroCentrosPage.vue` y su entrada del menú.
  - `/tablero` redirige a Inicio; con `?tipo=`, a Inventario › Consulta por equipo.
- **Consulta por equipo:** pasa a Inventario para planificación, en la pestaña «Consulta por equipo» (`?vista=equipo`, `?tipo=`). Mantiene las reglas de la SPEC 010 §8 y respeta el filtro de centro. Desde el resumen agrupado por tipo, cada fila ofrece «Ver por centro» y «Ver necesidades».

## 3. Atención requerida (`services/atencion.js › avisosDeAtencion`)

- **Una sola fuente** para Inicio y para el contador de la cabecera (`composables/useAtencion`). Reutiliza:
  - `avisosDeServicios` y `problemasRecurrentes`;
  - `controlesPendientes` y `proximosControles`;
  - `requiereAtencion` de vehículos;
  - `calcularNecesidades`;
  - `evaluarItinerario`.
- **Ahora:** pendientes de pago, períodos sin información, interrupciones abiertas, renovaciones vencidas, servicios recurrentes (nuevo), controles vencidos, extintores faltantes, vehículos que requieren mantenimiento o están detenidos (nuevo), incidentes con necesidades abiertas, infraestructura en evaluación y recorridos sin datos suficientes. Se ordenan por gravedad.
- **Próximos 60 días** (`PARAMETROS_ATENCION.diasProximos`, por validar): controles con próxima fecha dentro del horizonte («por vencer» a 30 días o menos; «programado» después), renovaciones próximas y **pagos pendientes con vencimiento dentro del horizonte** («Pago por vencer»). Se ordenan por fecha. Un pago pendiente ya vencido va a «Ahora» como «Pendiente vencido»; uno con vencimiento más lejano que el horizonte sigue en «Ahora».
- **Acción en línea:** cada aviso que la admite abre el diálogo del módulo sin salir de Inicio, solo si el perfil tiene el permiso.

  | Aviso | Acción | Permiso |
  | --- | --- | --- |
  | Control vencido o próximo; vehículo con atención | Registrar recarga, fumigación o mantenimiento (`MantenimientoDialog` precargado) | `mantenimiento.registrar` |
  | Pendiente o sin información | Informar período (`PeriodoDialog`) | `servicio.periodo` |
  | Interrupción abierta | Informar restablecimiento (`HechoServicioDialog`) | `hecho.registrar` |
  | Renovación vencida o próxima | Actualizar renovación (`ServicioDialog`) | `servicio.actualizar` |

  Al guardar, los avisos se recalculan sin recargar la página.
- **Destinos:** cada aviso trae una lista de destinos alternativos; se usa el primero al que el perfil tiene acceso. Por ejemplo, el mantenimiento de un vehículo abre su registro en la ficha del centro y, si el perfil no accede a ella, Vehículos.

## 4. Mapa de enlaces profundos

| Pantalla | Parámetros | Resultado | Registro inexistente o fuera de ámbito |
| --- | --- | --- | --- |
| Gestión de centros | `car`, `ambiente`, `novedad`, `bien`, `mantenimiento`, `registrar=1` (con `asociar`), **`tab`** | Selecciona el nodo. `tab` elige la pestaña del centro (`ficha`, `fotos`, `seguridad`, `ambientes`) o del ambiente (`ficha`, `fotos`, `bienes`, `novedades`, `intervenciones`). `seguridad=1` se mantiene como alias de `tab=seguridad`. `mantenimiento` abre `seguridad` y resalta el registro. | «Registro no disponible»; no se elige otro registro |
| Necesidades | `car`, **`tipo`** | Filtra por centro y por tipo de bien. | Tipo inexistente: aviso, sin filtrar |
| Inventario | `car`, **`vista=equipo`**, **`tipo`** | Abre el resumen o la consulta por equipo con ese tipo. | Tipo inexistente: aviso |
| Vehículos | **`car`**, `vehiculo`, `itinerario` | Filtra por centro y resalta el vehículo. Un vehículo de otro centro cambia el filtro a su centro. | «Registro no disponible» |
| Servicios | `car`, `servicio`, `anio`, `periodo` | Sin cambios (SPEC 005 L01). | Sin cambios |
| Incidencias, Itinerarios, Combustible, Precios | Sin cambios | Sin cambios | Sin cambios |

Además:

- La pestaña Ambientes de la ficha del centro muestra, por ambiente, las novedades abiertas y los elementos críticos, para que los enlaces de la matriz lleven a datos visibles.
- En Vehículos, el control de cada vehículo ofrece «Ver registro», que abre el mantenimiento en la ficha del centro.
- En la ficha del bien, «Ver necesidades» conserva el centro y el tipo.

## 5. Permisos y accesos

- Se retira la ruta `tablero` del menú; quien tenga acceso a Inicio ve la situación por centro de su ámbito. ⚠️ Por validar si Personal del CAR debe verla (hoy ve solo AMA, igual que antes en «Situación por CAR»).
- La consulta por equipo queda disponible para quienes acceden a Inventario: Equipo central y Personal del CAR (solo AMA). ⚠️ Por validar.
- Las acciones en línea respetan `puedeHacer`; los enlaces respetan `puedeAcceder`.

## 6. Una sola fuente por dato

- **Bien:** `mantenimientos.js › controlDeBien(bien)` usa `recarga_extintor` si el bien es un extintor y `mantenimiento_equipo` en los demás casos. Lo usan la ficha del bien, la pestaña de seguridad y la consulta por equipo.
- **Vehículo:**
  - `VehiculoDialog` deja de capturar el «último mantenimiento» y lo muestra a partir de los registros.
  - Se quita `mantenimiento.ultimoFecha` de `vehiculos.json`: sus valores ya coincidían con MAN-008 y MAN-009.
  - `controlDeVehiculo` lee ese campo solo como respaldo de datos anteriores sin registro.

## 7. Mejoras rápidas

- **«Deshacer» en las anulaciones:** se agrega a `useAnulacion`. Las anulaciones genéricas pasan `registro`, y las que tienen efectos adicionales pasan su propia reversión (`reactivarBien`, `reactivarCombustible`). Las anulaciones de bajas y reposiciones no ofrecen «Deshacer», porque no tienen reversión.
- **Contador de avisos en la cabecera:** cuenta los avisos de «Ahora» y lleva a Inicio › Atención. Solo aparece en los perfiles con acceso a Inicio.

## 8. Ola 2: simplificación de flujos (implementada)

| # | Mejora | Cómo funciona | Permiso |
| --- | --- | --- | --- |
| M7 | **Recorrido de verificación por ambiente** | En la ficha del ambiente, «Verificar ambiente (N sin verificar)» abre una lista de sus bienes activos (primero los nunca verificados). Cada bien se marca con un toque: «Coincide», «Diferencia» (con nota) o «No está». «Marcar los sin marcar como Coincide» completa el resto y una barra muestra el avance. Un solo guardado registra cada bien marcado con `informarVerificacion`, igual que la verificación individual. «No está» se registra como verificación con diferencias y la notificación ofrece abrir la ficha para registrar el incidente; no se crea ninguno automáticamente. | `bien.verificar` |
| M8 | **Mantenimiento en lote y flujos completos** | `MantenimientoDialog` admite varios objetivos al registrar: un registro por objetivo, con los mismos datos, y «Todos» selecciona los del centro. En la pestaña de seguridad: «Registrar recarga de todos» precarga los extintores; «Registrar extintor» pide el ambiente y abre el registro de bien con el tipo «Extintor» preseleccionado (también con `?registrar=1&car=&tipo=`); «Definir dotación» (o «Cambiar dotación») abre la ficha del centro. Al registrar el mantenimiento de un único vehículo que requiere atención, la casilla «El vehículo queda operativo» lo pasa a operativo y limpia el motivo y el presupuesto. La casilla queda desmarcada por defecto: es una decisión explícita. | `mantenimiento.registrar`, `bien.registrar`, `centro.actualizar`, `vehiculo.actualizar` |
| M9 | **Captura rápida del estado por elemento** | Los ocho desplegables se reemplazan por un selector B/R/M/I por elemento: un toque elige y volver a tocar quita la selección, que queda como no evaluado. «Marcar los no evaluados como Bueno» completa solo lo no indicado. En la ficha del ambiente, los elementos en mal estado ofrecen «Registrar novedad», con título, detalle y «requiere evaluación» precargados para revisar antes de guardar. | `ambiente.actualizar`, `centro.actualizar`, `novedad.registrar` |
| M10 | **Consulta por equipo en Inventario** | Implementada en la Ola 1 (§2), porque el retiro del Tablero la requería. | — |
| M11 | **Valoración en línea** | En Necesidades, «Valorar ‹tipo›» abre `PrecioDialog` en la misma pantalla y los importes se recalculan al guardar. | `precio.informar` (Equipo central) |
| M12 | **Ayuda contextual** | `AyudaContextual` (un icono junto al título, mediante el slot `ayuda` de `PageHeader`, o en la cabecera de una sección) reemplaza los avisos explicativos de Inventario, Necesidades, Servicios, Vehículos, Precios, Combustible y la pestaña de seguridad. Los `NoteBanner` quedan para advertencias, bloqueos y datos incompletos. | — |

## 8 bis. Ola 3: innovación (implementada salvo M17)

| # | Mejora | Cómo funciona | Archivos |
| --- | --- | --- | --- |
| M13 | **Buscador global** | Lupa en la cabecera y atajo `Ctrl + K` (o `⌘ + K`). Busca centros, ambientes, bienes (rótulo, nombre o código patrimonial), vehículos (placa), servicios (tipo, proveedor o suministro) y tipos de bien, además de las pantallas del menú («Ir a…»). El orden es: rótulo exacto, rótulo que empieza igual, título que empieza igual y, por último, todas las palabras. Se navega con ↑, ↓ y Enter. Solo indexa el ámbito del perfil y solo muestra destinos a los que el perfil accede. Cada resultado abre su enlace profundo (§4). Los 3 primeros resultados ofrecen además **acciones**, solo si el perfil tiene el permiso y accede al destino: «Registrar bien en ‹ambiente› (‹centro›)» (`bien.registrar`, abre el registro en ese ambiente), «Informar pago de ‹servicio› (‹centro›)» (`servicio.periodo`, abre el primer período pendiente o sin información), «Registrar mantenimiento en ‹centro›» (`mantenimiento.registrar`, pestaña de seguridad) y «Registrar itinerario de ‹vehículo›» (`itinerario.registrar`). | `services/busqueda.js`, `layout/BuscadorGlobal.vue`, `AppHeader` |
| M14 | **Escaneo del rótulo** | Usa la API nativa `BarcodeDetector` (QR, Code 128, Code 39 y EAN-13) con la cámara trasera. La imagen se procesa en el dispositivo; no se guarda ni se envía. Acepta el rótulo tal cual o un enlace con `?bien=`. En el buscador, un rótulo exacto abre la ficha. En el recorrido de verificación, el escaneo es continuo: cada rótulo del ambiente se marca «Coincide» y un rótulo ajeno se avisa. Sin soporte de cámara o sin permiso, se ofrece escribir o dictar el rótulo. | `composables/useEscaneo.js`, `common/EscanerRotulo.vue` |
| M15 | **Registro rápido en una frase** | En «Registrar bien», una frase dictada o escrita (p. ej. «silla de estudio, buena, 4 unidades, del 2019») se interpreta como tipo de bien, condición (en masculino o femenino), cantidad y adquisición (año, o mes y año). Antes de aplicar se muestra lo entendido y se pide confirmación. Lo no reconocido no cambia el formulario, y un tipo ambiguo («mesa») no se elige. | `utils/interpretacionVoz.js › interpretarRegistro`, `RegistroBienPanel` |
| M16 | **Simulador de presupuesto** | En Necesidades, se ingresa un monto o se usa un atajo (la mitad o el total del importe conocido). Las necesidades del filtro se ordenan por prioridad provisional (`PARAMETROS_PRIORIDAD`): reposición por incidente, luego peor condición y, a igualdad, la vida útil cumplida hace más tiempo. Se cubren en ese orden mientras haya saldo; la que no cabe queda «sin saldo» y se sigue con la siguiente. Las «sin valorar» se informan aparte, nunca como cero. Muestra el saldo y exporta a CSV. No aprueba compras. | `services/necesidades.js › priorizar, simularTecho`, `necesidades/SimuladorPresupuesto.vue` |
| M17 | **Persistencia local** | **No implementada.** El usuario fijó que los datos siguen ficticios y en memoria, desde los JSON (SPEC 005 §5). | — |
| M18 | **«Mi jornada»** | En Itinerarios, una tarjeta muestra lo pendiente del vehículo: recorridos sin ejecución («Informar ejecución») y ejecutados sin consumo («Declarar consumo», que abre `CombustibleDialog` en la misma pantalla). Incluye «Nuevo recorrido», «Informar carga» y el aviso de vehículo detenido o con mantenimiento pendiente. Para el chofer se titula «Mi jornada» y para los demás perfiles, «Pendientes del vehículo». Solo se listan los pasos que el perfil puede dar. | `movilidad/MiJornada.vue`, `ItinerariosPage` |

⚠️ Por validar:

- los criterios de prioridad del simulador, con la jefatura;
- el uso de rótulos físicos con QR, que hoy no existen;
- que el chofer use «Mi jornada» como vista principal.

Otros riesgos:

- **Safari para iOS** no ofrece `BarcodeDetector`: allí queda la entrada manual. Una librería de lectura sería una dependencia nueva, por decidir.
- **El dictado** usa el servicio de voz del navegador (SPEC 007). En el registro rápido no se deben dictar datos personales.

## 9. Verificación

**Comprobado sin ejecutar la aplicación.** Se hicieron tres comprobaciones:

- **Carga de los servicios en Node** con fecha de corte 30/10/2026:
  - Necesidades 2027: 9, S/ 11 090 y 2 sin valorar. AMA: 3, S/ 1 300 y 1 sin valorar.
  - Situación por centro: 3 centros; 3 controles vencidos y 1 por vencer; 2 extintores faltantes; 6 de 65 unidades en mal estado; 22 de 44 registros verificados; 1 vehículo con atención (S/ 1 800).
  - Atención requerida (Equipo central): 21 avisos en «Ahora», incluidos los nuevos de HOR-V01 («Requiere mantenimiento») y de AMA Luz («Problema recurrente»). En «Próximos», 2: la fumigación de AMA (en 21 días) y la renovación de AMA Luz (15/12/2026, en 46 días).
  - Controles: AMA-COM-EXT01 figura «Vencido» en las tres vistas. AMA-V01 tiene su último mantenimiento el 14/08/2026 y HOR-V01, el 12/11/2025.
  - Consulta por equipo con extintor: AMA 2 (vencido), HOR 2 (al día), ESP 0.
- **Compilación de las SFC** modificadas con `@vue/compiler-sfc`.
- **`node --check`** de servicios, composables, configuración y router, y validez de los JSON.

**Ola 2 en Node** (simulación con los mismos servicios):

- Registrar la recarga de los 2 extintores de AMA con la próxima fecha al 30/10/2027 quita el «Control vencido» de AMA-COM-EXT01. «Faltan 2 extintores» se mantiene, porque la dotación no cambia.
- Registrar el mantenimiento de HOR-V01 y dejarlo operativo quita su «Control vencido» y su «Requiere mantenimiento».
- Verificar los bienes activos de AMA-D1 sube los verificados de 22 a 26.
- Necesidades sigue en 9, S/ 11 090 y 2 sin valorar.

**Ajuste posterior (pagos por vencer y acciones del buscador):** con el pago pendiente de Luz de AMA (vence el 18/11/2026, en 19 días) en «Próximos», quedan 20 avisos en «Ahora» y 3 en «Próximos» (Equipo central; AMA: 11 y 3). Las cifras de 21 y 2 (AMA: 12 y 2) citadas arriba son anteriores a este ajuste. «luz» ofrece «Informar pago de Luz (CAR Demo Amanecer)», que abre el período de octubre; «dormitorio» ofrece «Registrar bien en Dormitorio 1 (‹centro›)» una vez por centro.

**Ola 3 en Node:**

- **Simulador**, con las 9 necesidades (S/ 11 090 conocidos y 2 sin valorar):
  - techo de S/ 5 000: 4 cubiertas (S/ 4 850), 3 sin saldo (S/ 6 240), 2 sin valorar aparte y un saldo de S/ 150;
  - techo igual al total: las 7 valoradas cubiertas.

  La prioridad 1 es HOR-COC-RF01 (reposición, inservible).
- **Buscador:**
  - «AMA-COM-EXT01» da el bien como primer resultado y «DMO-202», el vehículo HOR-V01;
  - con el ámbito de AMA, «HOR-D1-EXT01» no aparece;
  - un enlace con `?bien=ama-com-ext01` se lee como `AMA-COM-EXT01`.
- **Registro rápido:**
  - «silla de plástico, buena, cuatro unidades, del 2019» da silla de estudio, bueno, 4 y 2019;
  - «camarote regular, 2 unidades, de marzo de 2018» da camarote, regular, 2 y 2018-03;
  - «extintor malo del año dos mil veinte» da extintor, malo y 2020;
  - «mesa» no elige tipo.

**Lista de pruebas en navegador** (los resultados están en §9 bis):

1. **Inicio (Equipo central):** las cifras anteriores; las pestañas «Ahora (20)» y «Próximos 60 días (3)»; los filtros por tema y por centro.
2. **Acción en línea:** «Registrar recarga» en el aviso de AMA-COM-EXT01, con próxima fecha futura, hace desaparecer el aviso y baja el contador de la cabecera. «Informar restablecimiento» en Internet de AMA cierra la interrupción.
3. **Enlaces:** cada celda de la matriz abre la pestaña correcta (`tab=ambientes`, `tab=seguridad`) con el centro. Vehículos se abre filtrado por centro. `/tablero` lleva a Inicio y `/tablero?tipo=extintor` a la consulta por equipo.
4. **Inventario:** la pestaña «Consulta por equipo» reproduce la SPEC 010 §10 ítem 15. «Ver por centro» y «Ver necesidades» funcionan desde el resumen por tipo.
5. **Necesidades** con `?tipo=` filtra y un tipo inexistente muestra el aviso.
6. **Vehículo:** la ficha ya no pide el último mantenimiento y lo muestra a partir de los registros. «Ver registro» abre el mantenimiento resaltado.
7. **Deshacer:** anular y deshacer un mantenimiento, un bien y un registro de combustible deja el estado previo.
8. **Accesos:** Verificación física y Chofer no ven el contador ni Inicio. Personal del CAR ve solo AMA (11 avisos en «Ahora» y 3 en «Próximos»).
9. **Anchos** de 390, 768 y 1280 px: sin desbordamiento horizontal, incluidos el selector B/R/M/I y el recorrido de verificación a 390 px.
10. **Recorrido (Verificación física):** en AMA-D1, «Verificar ambiente», marcar todo como «Coincide» y guardar. Los bienes muestran «Verificado el 30/10/2026» y sus antecedentes, la verificación. «No está» deja la notificación con «Ver ‹rótulo›».
11. **Lote:** en AMA › Seguridad, «Registrar recarga de todos» guarda 2 registros y el estado pasa a «Al día». «Registrar extintor › Comedor» abre el registro con el tipo «Extintor» y el rótulo sugerido, y «Guardar y registrar otro» conserva el tipo.
12. **Estado por elemento:** en «Actualizar ambiente», tocar «M» en Ventanas y luego «Marcar los no evaluados como Bueno» deja 8 de 8. Volver a tocar «M» la quita. En la ficha, «Registrar novedad» abre el diálogo precargado.
13. **Valorar:** en Necesidades (Equipo central), «Valorar» de un tipo sin precio abre el diálogo. Al guardar, «Sin valorar» baja y el importe conocido sube.
14. **Ayuda:** el icono junto al título de Inventario, Necesidades, Servicios, Vehículos, Precios y Combustible despliega la explicación, y la pantalla ya no muestra ese aviso fijo.
15. **Buscador:** `Ctrl + K` lo abre desde cualquier pantalla. Escribir «AMA-COM» y pulsar Enter abre la ficha. El perfil Chofer solo encuentra su vehículo y las pantallas a las que accede.
16. **Escaneo** (Chrome en Android, con un QR de prueba con el rótulo): en el buscador abre la ficha; en el recorrido marca el bien y avisa si es ajeno. Al negar el permiso de cámara aparece la entrada manual.
17. **Registro rápido:** la frase aplica tipo, condición, cantidad y adquisición tras confirmar, y el rótulo sugerido corresponde al tipo.
18. **Simulador:** con S/ 5 000 aparecen las cifras de arriba y el CSV coincide con la tabla.
19. **Mi jornada (Chofer):** en AMA-V01 se listan los recorridos pendientes. «Declarar consumo» abre el diálogo con el recorrido elegido y, al guardar, la tarea desaparece.
20. **Escaneo en PC** (Chrome o Edge en Windows, por `localhost` o HTTPS): el escáner abre la webcam con la vista en espejo, sin el aviso de navegador no compatible. Un QR con `AMA-COM-EXT01`, mostrado en un móvil, abre la ficha desde el buscador. Con dos cámaras aparece «Cambiar de cámara».
21. **Sin cámara o sin permiso:** aparece el motivo y el campo manual recibe el foco. Un lector USB escribe el rótulo y abre la ficha con Enter. Por `http://` con la dirección de red se avisa que la cámara requiere HTTPS.
22. **Volver:** Inicio › aviso › Servicios › «Volver a Inicio» restaura la pestaña «Próximos 60 días» y la posición. En Gestión de centros › bien › «Ver necesidades», «Volver a Gestión de centros» abre el mismo bien en la misma pestaña.
23. **Volver, casos límite:** al entrar por el menú no hay botón; tras recargar el botón sigue; desde Inicio › Servicios › Centros, «Volver» lleva a Servicios y, desde ahí, a Inicio.
24. **Resaltado:** en Servicios, elegir «Agua» resalta su fila (o su tarjeta en móvil) y baja a la ficha si no está a la vista, también a 1280 px. En Necesidades › Consolidado, el centro elegido queda resaltado. En el árbol de Gestión de centros el nodo elegido tiene fondo.
25. **Sin desbordes** a 390, 768 y 1280 px en las pantallas con el botón «Volver».
26. **Sin reapertura (M22):** Inicio › aviso de pago › Servicios abre el período. Al cerrarlo, ir a Centros y pulsar «Volver a Servicios básicos y pagos»: el período **no** se reabre y el servicio sigue resaltado. Lo mismo al recargar.
27. **Registro desde un enlace (M22, M24):** `centros?registrar=1&car=AMA&tipo=extintor`, abierto desde Inicio, abre el registro. «Guardar» avisa con «Volver a Inicio». Si luego se vuelve a esa entrada, se ve la ficha, sin el formulario.
28. **Ficha anterior (M23):** en Gestión de centros, de un bien a su componente y luego a su reposición; «Volver a ‹ficha›» recorre el camino inverso. Un clic en el árbol quita el botón.
29. **Hecho anterior (M23):** en Incidencias, con un filtro aplicado, el historial de un bien lleva a un hecho fuera del filtro, lo que limpia los filtros. «Volver al hecho ‹título›» restaura el hecho y los filtros.
30. **Consumo y rendimiento (M24):** Itinerarios › «Registrar consumo» › guardar: el aviso ofrece «Volver a Itinerarios» y regresa al mismo recorrido. En Vehículos, con origen en Itinerarios, el enlace «Ver el recorrido» no aparece.
31. **Sin salida (M25):** `centros?bien=NO-EXISTE`, abierto desde el buscador, muestra «Volver a ‹pantalla›» como acción principal; lo mismo en «Sin acceso» y en una dirección inexistente.
32. **Cambio de vista (M26):** Inventario › «Ver por centro» › «Volver al resumen» deja resaltada la fila del tipo. En Necesidades › Consolidado, elegir un centro y luego «Volver al consolidado por centro» resalta su fila.
33. **Pulido (M27):** desde la miga «Inicio» no aparece «Volver». En móvil, Gestión de centros muestra «Árbol» y «Volver a ‹pantalla›» como botones distintos. El botón «Volver» explica el atajo en su tooltip.

## 9 bis. Resultados de la verificación en navegador (09/11/2026)

Se recorrió la aplicación con `quasar dev` y un navegador automatizado (Chromium de escritorio), con los perfiles Equipo central, Personal del CAR, Verificación física y Chofer.

**Correcto:**

- **Inicio:** indicadores (3 controles vencidos, 6 / 65 en mal estado, 22 / 44 verificados, S/ 11 090), pestañas «Ahora (20)» y «Próximos 60 días (3)». Personal del CAR: 11 y 3.
- **Acción en línea:** «Registrar recarga» del aviso de AMA-COM-EXT01 abre el diálogo con el tipo y el extintor precargados; al guardar, «Ahora» baja de 20 a 19, los controles vencidos de 3 a 2 y el contador de la cabecera, a 19.
- **Redirecciones y enlaces:** `/tablero` abre Inicio; `/tablero?tipo=extintor` abre Inventario › Consulta por equipo; `?tab=ambientes` muestra «1 novedad abierta» y «1 elemento crítico» en Dormitorio 1; `seguridad=1` abre la pestaña; `?mantenimiento=` abre la pestaña y resalta el registro; Vehículos filtra por `?car=`; `necesidades?tipo=inexistente` avisa «Registro no disponible».
- **Simulador:** con S/ 5 000, 4 cubiertas (S/ 4 850), 3 sin saldo (S/ 6 240), 2 sin valorar aparte y saldo de S/ 150, igual que en Node.
- **Buscador:** `Ctrl + K` lo abre; «luz» ofrece el servicio y «Informar pago de Luz»; «AMA-COM-EXT01» abre la ficha del bien.
- **Escáner:** sin `BarcodeDetector` muestra el aviso y la entrada manual; un rótulo real abre la ficha y uno inexistente avisa sin navegar.
- **Recorrido de verificación:** en AMA-D1, «Marcar los 11 sin marcar», guardar: los verificados pasan de 22 a 26 y el bien muestra «Verificado el 30/10/2026».
- **Registro:** `?registrar=1&tipo=extintor` preselecciona el tipo, el rótulo `AMA-COM-EX01` y la vida útil. El registro rápido «camarote regular, 2 unidades, de marzo de 2018» aplica tipo, condición, cantidad y adquisición tras confirmar. Salir con datos escritos pide confirmar, incluso al recargar.
- **Estado por elemento:** pasa de 5 a 8 evaluados con «Marcar los no evaluados», sin alterar Ventanas («M»). «Registrar novedad» abre el diálogo precargado.
- **Valoración en línea:** el precio de un tipo sin valorar sube el importe conocido de S/ 11 090 a S/ 11 390 y los sin valorar de 2 a 1.
- **Deshacer:** anular y deshacer un mantenimiento lo devuelve y avisa «Anulación deshecha».
- **Chofer:** no ve Inicio ni el contador; «Mi jornada» lista la ejecución pendiente y, tras informarla, el consumo por declarar (con el recorrido preseleccionado); al declararlo queda «Sin pendientes».
- **Accesos:** Personal del CAR no ve Precios; Verificación física solo ve Gestión de centros e Incidencias y no ve el contador.
- **Consola:** sin errores, salvo el `favicon.ico` inexistente.

**Corregido durante la verificación:**

- **Servicios a 768 px:** la etiqueta «Interrumpido · restablecimiento no informado» de la ficha desbordaba la página 10 px (ya existía antes). Las etiquetas dentro de una ficha ahora se ajustan a su celda (`.sg-kv__value .sg-chip`).
- **Subtítulo de Períodos de pago:** se retiró el que añadió la Ola 2 y su instrucción pasó a la ayuda contextual.

**No verificado:**

- **Cámara real:** el navegador de prueba no tiene `BarcodeDetector`, así que no se comprobó la lectura de un código QR.
- **Dictado por voz:** requiere micrófono y un dispositivo móvil.
- **Navegadores:** solo Chromium de escritorio; faltan Android y Safari.
- **Anchos:** 390 y 768 px sin desbordes en 10 pantallas, y el recorrido a 390 px sin desborde. No se hizo revisión visual ni 1280 px.
- **Puerto:** en este equipo `localhost:9000` lo ocupa otro proceso y respondía basura; se usó la dirección de red.

## 10. Ola 4: escaneo en PC, «Volver» a la pantalla de origen y resaltado de la selección

**Origen:** propuestas del usuario tras la Ola 3. Decisiones:

- **Lector:** jsQR (1.4.0, licencia Apache-2.0) cuando el navegador no trae lector nativo.
- **«Volver»:** lleva a la pantalla anterior, paso a paso.

| # | Mejora | Cómo funciona | Archivos |
| --- | --- | --- | --- |
| M19 | **Escaneo en PC y laptops** | La cámara ya no depende de `BarcodeDetector`, sino de que exista cámara en un contexto seguro (HTTPS o `localhost`). Con lector nativo se leen QR y códigos de barras, como antes. Sin él (Chrome y Edge en Windows, Firefox, Safari) se lee QR con jsQR, que se carga solo en ese caso: el cuadro se reduce a 640 px como máximo y se lee cada 350 ms. Se pide la cámara trasera si existe; con la webcam frontal de una laptop, la vista previa se muestra en espejo (la lectura usa la imagen original). Con varias cámaras aparece «Cambiar de cámara». Si falla, el aviso explica el motivo (permiso negado, sin cámara, cámara en uso o conexión sin HTTPS) y el campo manual recibe el foco. Ese campo sirve también para un lector de códigos USB, que escribe el rótulo y pulsa Enter. | `composables/useEscaneo.js`, `common/EscanerRotulo.vue` |
| M20 | **«Volver a ‹pantalla de origen›»** | Al llegar a una pantalla por un enlace desde otra (aviso, tabla, ficha, buscador o campana), un botón junto a las migas ofrece volver. El origen se guarda en la propia entrada del historial (`history.state.sigrecOrigen`), así sobrevive a la recarga y a «Atrás» y «Adelante». Si solo cambia la consulta en la misma pantalla, se conserva el origen; el menú y el logo no ofrecen volver. «Volver» retrocede por el historial, así la pantalla de origen recupera sus filtros, su pestaña y su posición. Para eso, Servicios (centro, año y servicio), Itinerarios (vehículo y recorrido), Vehículos (filtros), Gestión de centros (nodo y filtros del árbol) y la pestaña de cada ficha del explorador ahora guardan su estado con `useEstadoNavegacion`. Lo guardado en la entrada prevalece sobre el enlace profundo, porque es lo que el usuario eligió después. El botón solo aparece si el perfil puede ver la pantalla de origen. | `router/retorno.js` (`origenDeNavegacion`, `instalarRetorno`, `volver`), `layout/VolverOrigen.vue`, `PageHeader`, `GestionCentrosPage`, `InicioPage`, `AppDrawer`, `AppHeader`, `DetallePanel` |
| M21 | **Resaltado de la selección** | Cuando un enlace cambia el registro dentro de la misma pantalla, la fila o tarjeta elegida queda resaltada (fondo suave, barra a la izquierda y `aria-current`) y, si su detalle no está a la vista, se baja hasta él, en cualquier ancho y respetando la preferencia de movimiento reducido. Se aplica en Servicios (antes sin resaltado), Necesidades › Consolidado (centro filtrado), el árbol de Gestión de centros (fondo además del color) y, con el mismo estilo, en Incidencias, Itinerarios, Vehículos y Precios. | `css/app.scss`, `utils/navegacion.js › mostrarDetalle` y las páginas citadas |

**Verificación en Node:** 10 escenarios de `retorno.js` con un historial simulado:

- origen nulo al cargar y al entrar por el menú;
- origen Inicio de Inicio a Servicios, y se conserva al cambiar la consulta;
- de Servicios a Centros, el origen es Servicios;
- «Volver» retrocede 1 y luego 2 entradas;
- «Adelante» y recarga respetan el origen guardado;
- una navegación fallida consume la marca del menú;
- sin posición válida, abre la pantalla de origen.

Los SFC compilan con `@vue/compiler-sfc`.

**Pendiente en navegador** (requiere autorización para `quasar dev`): pruebas 20–25 de §9. Para la cámara se necesita `localhost` (por ejemplo `quasar dev --port 9100`, porque el 9000 está ocupado en este equipo) o HTTPS.

⚠️ Riesgos:

- **jsQR solo lee QR.** Los códigos de barras 1D en PC requieren el lector nativo o un lector USB.
- **La cámara exige HTTPS** en cualquier despliegue que no sea `localhost`. No se cambió `quasar.config.js`.
- **«Volver» depende del historial de la pestaña.** Un enlace abierto en una pestaña nueva no tiene origen.

## 11. Ola 5: auditoría del retorno

**Origen:** auditoría de los recorridos en los que el usuario también «se va» y necesita regresar, pero la Ola 4 no los cubría porque no cambian de ruta, o se comportaba mal.

| # | Hallazgo | Mejora | Archivos |
| --- | --- | --- | --- |
| M22 | Al volver a una entrada con `?periodo=`, `?registrar=1` o `?itinerario=`, el diálogo o el modo registro se reabrían. | `primeraVisita()` es verdadera solo la primera vez que se muestra una entrada nueva del historial (marca `sigrecAbierto`). Las aperturas automáticas dependen de ella. Al volver o recargar se conservan la selección y el resaltado, pero no se reabre el formulario. | `router/retorno.js`, `ServiciosPage`, `GestionCentrosPage`, `CombustiblePage`, `VehiculosPage` |
| M23 | Los saltos entre fichas dentro de una pantalla no tenían retorno: un bien que lleva a su padre, componente o reposición, un ambiente que lleva a un bien, un hecho que lleva a otro. En Incidencias, el salto podía limpiar los filtros. | Una pila corta de fichas anteriores (`useRecorridoInterno`, como máximo 10), guardada en la entrada del historial. En Gestión de centros, la barra «Volver a ‹ficha›» aparece sobre el detalle, y un clic en el árbol vacía la pila. En Incidencias, «Volver al hecho ‹título›» restaura el hecho **y los filtros**, y elegir en la tabla vacía la pila. | `composables/useRecorridoInterno.js`, `GestionCentrosPage`, `IncidenciasPage` |
| M24 | Al terminar una tarea abierta por un enlace, no había un camino directo de vuelta. Vehículos tenía un «Volver al recorrido» propio que creaba otra entrada en el historial. | `useRetorno().avisarGuardado(mensaje, { conRetorno })`: cuando el formulario lo abrió un enlace, el aviso de guardado incluye «Volver a ‹origen›». Se aplica al terminar el registro de un bien, declarar un consumo y completar la ficha del vehículo. El enlace propio de Vehículos solo aparece si no se llegó desde Itinerarios. | `composables/useRetorno.js`, `RegistroBienPanel`, `CombustibleDialog`, `VehiculoDialog` |
| M25 | «Registro no disponible», «Sin acceso» y «Página no encontrada» solo ofrecían ir al listado o al inicio. | Muestran «Volver a ‹origen›» como acción principal (`VolverOrigen destacado`). La salida anterior queda como alternativa. | `RegistroNoDisponible`, `SinAcceso`, `ErrorNotFound`, `VolverOrigen` |
| M26 | Inventario › «Ver por centro» cambiaba de pestaña sin camino de vuelta. Necesidades › Consolidado › centro filtraba y **ocultaba el consolidado**, por lo que la fila resaltada en la Ola 4 nunca se veía. | «Volver al resumen» y «Volver al consolidado por centro» restauran la vista, bajan a la fila de origen y la dejan resaltada. El valor se recuerda en `useEstadoNavegacion`. | `InventarioPage`, `NecesidadesPage` |
| M27 | Las migas ofrecían «Volver», y en móvil convivían dos flechas iguales con destinos distintos. | La miga «Inicio» es navegación principal. La flecha del panel pasa a «Árbol», con el icono `account_tree`. El tooltip de «Volver» recuerda «Atrás» y `Alt + ←`. | `PageHeader`, `DetallePanel`, `VolverOrigen` |

**Dos niveles de retorno:**

- «Volver a ‹pantalla›» va entre pantallas, junto a las migas o el título.
- «Volver a ‹ficha›» va dentro de la pantalla, sobre el detalle, con el icono `undo`.

**Verificación en Node:**

- `retorno.js`, 11 escenarios: la apertura es verdadera solo en la entrada nueva; no se repite en la misma entrada, al volver ni al recargar; una entrada nueva de la misma pantalla sí abre.
- `useRecorridoInterno`: tope de 10, regreso en orden inverso, se vacía y se recupera desde la entrada del historial.

Los SFC compilan con `@vue/compiler-sfc`.

**Pendiente en navegador:** pruebas 26–33 de §9.

⚠️ Riesgo: «Atrás» ya no reabre los formularios abiertos por un enlace. Es el comportamiento buscado; conviene confirmarlo con los usuarios.
