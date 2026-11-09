# SPEC 011 — Auditoría funcional: Inicio como panel único, enlaces con contexto y una sola fuente por dato

- **Estado:** Olas 1 (M1–M6), 2 (M7–M12) y 3 (M13–M16 y M18) implementadas en el prototipo. M17 (persistencia local) no se implementa por decisión del usuario: los datos siguen ficticios y en memoria. Verificación en navegador realizada el 09/11/2026 (ver §9 bis), con una excepción: la lectura real de la cámara.
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
