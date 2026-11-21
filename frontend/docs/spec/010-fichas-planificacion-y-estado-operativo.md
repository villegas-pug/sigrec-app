# SPEC 010 — Fichas ampliadas, inventario para planificación, control preventivo y tablero de control

- **Estado:** P0, P1, P2, P3 y P4 implementados en el prototipo. La verificación en navegador está pendiente de autorización.
- **Fecha:** 2026-11-09
- **Origen:** reunión con la jefa de unidad y el jefe de proyecto del 30/10/2026 ([aportes funcionales](../reuniones/2026-10-30_1234_reunion-jefa-unidad-jefe-proyecto/2026-10-30_1234_transcripcion_reunion-jefa-unidad-jefe-proyecto.md)) contrastada con el prototipo y las SPEC 001–009.
- **Complementa:** SPEC 003 (mantenedores), SPEC 005 (servicios y captura rápida) y SPEC 008 (fichas del explorador). Donde difieran, prevalece esta SPEC.
- **Actualizada por:** [SPEC 011](011-auditoria-navegacion-y-unificacion.md): el «Tablero de control» se fusionó en Inicio y la «Consulta por equipo» pasó a Inventario (§5, §8 y §10 ítems 12, 14, 15 y 16).
- **Reemplaza:** SPEC 003 §8 únicamente en el punto «estado de vehículos (SOAT, revisión técnica, odómetro)»: el **estado operativo y el presupuesto de mantenimiento** pasan a estar dentro del alcance. SOAT, revisión técnica y odómetro siguen fuera.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios**; el estado vive en memoria y los permisos por perfil son controles de interfaz (SPEC 005 §0).
- Las propuestas de la reunión son contexto, no autorización por sí mismas. **P2 y P3 se implementaron con supuestos provisionales** (periodicidades, umbrales e indicadores) porque las direcciones de los centros aún no responden el [cuestionario de validación](../reuniones/2026-10-30_1234_reunion-jefa-unidad-jefe-proyecto/2026-10-30_1234_cuestionario_validacion-campos.md). Cada supuesto está marcado «por validar» y centralizado para cambiarlo sin tocar la lógica.
- Todos los campos nuevos son **opcionales** y compatibles con los registros existentes: un registro sin ellos se sigue leyendo y se presenta como «No evaluado», «No informado» o «Sin programar», nunca como bueno, al día ni cero.
- No cambian las reglas de necesidades ni los valores de la SPEC 001 §8 (9 necesidades, S/ 11 090; AMA: 3 necesidades, S/ 1 300).
- **Turnos y personal por centro** queda fuera de alcance (SPEC 005 §5; el audio no permite precisar qué se espera gestionar). Solo figura como pregunta en el cuestionario.

## 1. Decisiones

| # | Decisión |
| --- | --- |
| 1 | El estado de la infraestructura se registra **por elemento** (puertas, ventanas, pintura, pisos, techo, estructura, instalaciones eléctricas y sanitarias), en el ambiente y en la construcción del centro. La lista es provisional. |
| 2 | El **mobiliario y los equipos de un ambiente no se capturan aparte**: su estado se calcula con los bienes activos del ambiente (los componentes cuentan como bienes). |
| 3 | El inventario orientado a planificación es un **reporte** sobre los datos existentes, no un nuevo registro. Reutiliza `calcularNecesidades`. |
| 4 | Los **problemas recurrentes** de un servicio se derivan de sus hechos de interrupción; no son un dato capturado. |
| 5 | El estado operativo de un vehículo y su presupuesto estimado son **datos de la ficha del vehículo**. El presupuesto solo suma si se informó. |
| 6 | Hay **un único registro de mantenimientos y controles** para fumigación, extintores, equipos y vehículos. No se crean mecanismos paralelos por tipo. |
| 7 | Los **extintores son bienes** de un tipo del catálogo (`extintor`): su cantidad sale del inventario. Solo la dotación requerida se guarda en la ficha del centro. |
| 8 | El **tablero de control** no calcula nada propio: reúne cifras que ya producen los demás módulos y cada una enlaza a su detalle. |

## 2. Trazabilidad

| ID | Reunión | Implementación |
| --- | --- | --- |
| F1 | Ficha de centros y ambientes: área, propio o alquilado, estado de la infraestructura; condición física del ambiente (puertas, pintura, estructura) [01:14–02:44] | **Ya existía:** área construida, condición propio/alquilado, estado general. **Nuevo:** área del terreno, estado por elemento y resumen del mobiliario. `CentroFichaDialog`, `AmbienteDialog`, `DetalleCentro`, `DetalleAmbiente`, `EstadoElementos`, `services/infraestructura.js` |
| F2 | Inventario: cantidades por tipo, condición y valor aproximado para proyectar compras [02:44–03:21; 05:17–05:41] | **Ya existía:** captura breve, cantidad, condición y adquisición. **Nuevo:** pantalla «Inventario para planificación». `InventarioPage`, `services/inventario.js`, `utils/csv.js` |
| F3 | Servicios: antigüedad, renovación y problemas recurrentes [05:41–06:31; 08:41–09:10] | **Ya existía:** períodos, pagos, contacto y hechos de suministro. **Nuevo:** inicio, renovación, avisos y recurrencia. `ServicioDialog`, `ServiciosPage`, `services/servicios.js` |
| F4 | Vehículos: operativos frente a detenidos y presupuesto de mantenimiento [04:46–05:14] | **Nuevo:** estado operativo, mantenimiento y resumen. `VehiculoDialog`, `VehiculosPage`, `ItinerarioDialog`, `services/vehiculos.js` |
| F5 | Control preventivo: cuándo fumigar, cuántos extintores tiene cada centro, cuáles faltan y cuándo recargar [00:00–00:44] | **Nuevo (P2):** §7. `ControlPreventivo`, `MantenimientoDialog`, `services/mantenimientos.js` |
| F6 | Vista ejecutiva para varios centros; mantenimiento de equipos [00:00–00:44; 03:27–05:14] | **Nuevo (P3):** §8. `TableroCentrosPage`, `services/tablero.js` |
| F7 | Turnos y personal por centro [06:58–07:26] | **Fuera de alcance.** |

## 3. Modelo de datos

- `ambiente.estadoElementos?: { [elemento]: condicion }` y `car.inmueble.construccion.estadoElementos?` con la misma forma. Solo se guardan los elementos evaluados; sin ninguno se guarda `null`. Catálogo: `ELEMENTOS_INFRAESTRUCTURA`.
- `car.inmueble.construccion.areaTerrenoM2?`: número, distinto del área construida.
- `car.inmueble.seguridad?: { extintoresRequeridos }`: dotación requerida de extintores; vacía = no definida.
- `servicio.inicio?`: `'AAAA'` o `'AAAA-MM'` (un año conocido no se convierte en enero).
- `servicio.renovacion?: { fecha, detalle }`.
- `vehiculo.estadoOperativo?`: `operativo | requiereMantenimiento | detenido`. Catálogo: `ESTADOS_VEHICULO`.
- `vehiculo.mantenimiento?: { motivo, presupuestoEstimado, ultimoFecha }`. `motivo` y `presupuestoEstimado` solo aplican si el vehículo requiere mantenimiento o está detenido.
- Colección `mantenimientos` (`src/data/mantenimientos.json`): `{ id, tipo, carId, bienId?, vehiculoId?, fecha, proxima?, detalle?, importe?, informadoPor, registradoEl, anulacion? }`. `tipo`: `fumigacion | recarga_extintor | mantenimiento_equipo | mantenimiento_vehiculo` (`TIPOS_MANTENIMIENTO`). `proxima` es la fecha que programa el control siguiente.
- Tipo de bien `extintor` («Extintor PQS 6 kg») en `tipos-bien.json`; los extintores del centro son bienes activos de ese tipo.

## 4. Reglas

| Regla | Implementación |
| --- | --- |
| Un elemento sin evaluar se muestra «No evaluado»; no se asume bueno. | `EstadoElementos` |
| Un elemento en condición mala o inservible sugiere registrar una novedad, pero **no la crea**: la novedad sigue siendo el hecho. | `infraestructura.js › elementosCriticos` |
| El resumen de mobiliario cuenta los bienes activos ponderados por cantidad; sin condición se cuenta como «No constatable». | `infraestructura.js › conteoPorCondicion` |
| El inventario cuenta solo bienes activos. El valor aproximado es precio referencial × cantidad; las unidades sin precio se informan aparte y una fila sin ningún precio queda «Sin valorar», nunca en cero. | `inventario.js › resumenInventario`, `estadoValoracion` |
| La necesidad del año del inventario sale de `calcularNecesidades`, de modo que coincide con la pantalla Necesidades. | `inventario.js` |
| Un servicio es **recurrente** con 3 o más interrupciones vigentes en los últimos 12 meses (umbral provisional). | `servicios.js › problemasRecurrentes`, `config/demo.js › PARAMETROS_SERVICIOS` |
| La antigüedad se calcula con `inicio` a la fecha de corte; con solo el año no se muestran meses. Sin `inicio`: «Antigüedad no informada». | `servicios.js › antiguedadServicio` |
| Una renovación a 60 días o menos de la fecha de corte genera «Renovación próxima»; una fecha pasada, «Renovación vencida». No cuenta como pago pendiente ni altera «Al día». | `servicios.js › estadoRenovacion`, `avisosDeServicios` |
| Un vehículo sin estado informado no cuenta como operativo. El presupuesto estimado suma solo los vehículos que requieren atención y lo informaron; el resto se cuenta como «sin estimar». | `vehiculos.js › resumirEstadoVehiculos` |
| Registrar un itinerario de un vehículo detenido muestra un aviso, pero **no lo bloquea** (regla por validar). | `ItinerarioDialog` |
| La exportación a CSV es común a Necesidades e Inventario. | `utils/csv.js › exportarCsv` |

## 5. Permisos y accesos

- **Acciones nuevas:** `mantenimiento.registrar`, `mantenimiento.actualizar` y `mantenimiento.anular`, incluidas en el mantenimiento que comparten Equipo central y Personal del CAR. Verificación física y Chofer no las tienen. ⚠️ Por validar (por ejemplo, si el chofer debe registrar el mantenimiento de su vehículo).
- Sin acciones nuevas para el resto: el estado por elemento se edita con `centro.actualizar` y `ambiente.actualizar`; los datos del servicio, con `servicio.actualizar`; los del vehículo, con `vehiculo.actualizar`. La dotación de extintores se edita en la ficha del centro.
- **Inventario para planificación** (`inventario`, grupo «Necesidades y presupuesto»): Equipo central y Personal del CAR, limitada a su ámbito.
- ~~**Tablero de control** (`tablero`): solo Equipo central.~~ Reemplazado por la SPEC 011 §5: la situación por centro está en Inicio y `/tablero` redirige allí.

## 6. ⚠️ Por validar con el jefe de proyecto y las direcciones de los centros

El detalle está en el [cuestionario de validación](../reuniones/2026-10-30_1234_reunion-jefa-unidad-jefe-proyecto/2026-10-30_1234_cuestionario_validacion-campos.md). Los supuestos del prototipo son:

| Supuesto | Valor provisional | Dónde cambiarlo |
| --- | --- | --- |
| Elementos de infraestructura | Ocho, iguales para centro y ambiente | `ELEMENTOS_INFRAESTRUCTURA` |
| Recurrencia de un servicio | 3 interrupciones en 12 meses | `PARAMETROS_SERVICIOS` |
| Aviso de renovación | 60 días | `PARAMETROS_SERVICIOS` |
| «Por vencer» de un control | 30 días | `PARAMETROS_CONTROL` |
| Periodicidad sugerida | Fumigación 6 meses; recarga de extintor 12; equipo 12; vehículo 6 | `TIPOS_MANTENIMIENTO` |
| Qué es «detenido» y cómo se estima el presupuesto | Dato informado por el centro | `ESTADOS_VEHICULO` |
| Valor aproximado del inventario | Precio referencial del catálogo | `services/inventario.js` |
| Indicadores del tablero | Los de §8 | `services/tablero.js` |

Siguen abiertos: el catálogo de servicios (fumigación como servicio o como control preventivo), los responsables de cada control, quién ve el tablero y qué se espera de turnos y personal.

## 7. Control preventivo y mantenimientos (P2)

- Un **mantenimiento** se aplica al centro (fumigación), a un bien (recarga de un extintor o mantenimiento de un equipo) o a un vehículo. El registro y la corrección se hacen en un solo diálogo (`MantenimientoDialog`); el tipo y el objetivo no se cambian al corregir.
- **Estado del control** según la próxima fecha frente a la fecha de corte: *vencido* (pasada), *por vencer* (dentro del umbral), *al día*, y *sin programar* (sin próxima fecha: no se asume al día). El estado de un objetivo es el de su **último** mantenimiento vigente.
- **Dotación de extintores:** faltantes = máx(0, requeridos − extintores activos). Si el centro no definió los requeridos, los faltantes no se calculan («No calculable»), nunca se asumen cero.
- **Dónde se ve:**
  - Gestión de centros › centro › pestaña «Seguridad y mantenimiento»: extintores (requeridos, activos, faltantes, recarga de cada uno), fumigación e historial del centro con acciones de actualizar, anular y reactivar.
  - Ficha del bien: «Mantenimiento» para equipos y extintores, con su último mantenimiento, próximo y estado; el historial del bien incluye los mantenimientos.
  - Vehículos: último mantenimiento (el más reciente entre la ficha y los registros) y estado del próximo; acción «Registrar mantenimiento».
  - Inicio › «Atención requerida»: controles vencidos, por vencer y extintores faltantes, con enlace al registro exacto (`?mantenimiento=`) o a la pestaña (`?car=&seguridad=1`). Un id inexistente o fuera del ámbito muestra «Registro no disponible».
- Un bien dado de baja o un vehículo anulado deja de generar avisos. Anular un mantenimiento lo saca del cálculo: la próxima fecha vuelve a ser la del anterior.
- La reunión no define responsables, periodicidades oficiales ni avisos fuera de SIGREC: los avisos se consultan solo dentro de la aplicación y los destinatarios siguen por definir.

## 8. Vista ejecutiva de control (P3)

- **Actualizado por la SPEC 011 §2:** la matriz por centro es ahora la «Situación por centro» de Inicio y la «Consulta por equipo» está en Inventario. Las reglas de esta sección se mantienen.
- **Estado por centro:** una fila por centro con infraestructura (estado general, ambientes en mal estado, elementos críticos), novedades abiertas, bienes (activos y en mal estado), controles preventivos (vencidos, por vencer, extintores faltantes, fumigación sin programar), vehículos (que requieren atención, detenidos, presupuesto estimado) y servicios (pendientes, interrupciones abiertas, renovaciones, recurrentes, sin información). Cada celda enlaza a su detalle. En pantallas estrechas cada centro es una tarjeta.
- **Consulta por equipo:** se elige un tipo de bien y se ve, por centro, cuántas unidades hay, en qué condición, cuándo recibió mantenimiento, el estado de su control y la atención requerida. Un centro sin el equipo figura como «No tiene este equipo». El estado de un conjunto de controles es el de su peor integrante; un equipo con unidades pero sin controles programados figura «Sin programar».
- Las cifras salen de las mismas funciones que usan los módulos de origen (`conteoPorCondicion`, `resumenInventario`, `controlesPendientes`, `resumirEstadoVehiculos`, `resumirAvisos`), por lo que coinciden con ellos.
- Los indicadores gerenciales no figuraban en la SPEC 001; los de esta pantalla son un punto de partida que debe priorizarse con la unidad central.

## 9. Riesgos

- El estado de la infraestructura, la dotación de seguridad y la dirección del inmueble de un CAR son datos sensibles para la protección de NNA (SPEC 003 §9): en la fase real requieren acceso restringido. El tablero concentra esa información, por lo que su acceso debe ser restringido.
- El valor aproximado no es valor contable ni aprueba compras.
- El estado operativo y el presupuesto de un vehículo, y los mantenimientos, no están respaldados por un documento; en producción deberían vincularse a una orden, cotización o constancia.
- La autorización sigue siendo solo de cliente (SPEC 003 §9).

## 10. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

**Comprobado sin ejecutar la aplicación** (carga de los servicios en Node con fecha de corte 30/10/2026): necesidades 2027 = 9, S/ 11 090 y 2 sin valorar; AMA = 3, S/ 1 300 y 1 sin valorar; controles pendientes y totales del tablero como se detalla abajo.

1. **Ambiente sin estado:** un ambiente sin `estadoElementos` muestra los ocho elementos como «No evaluado». En AMA-D1 se ven las ventanas en «Malo» con la sugerencia de registrar una novedad.
2. **Edición:** al actualizar el ambiente, dejar un elemento vacío lo guarda como no evaluado. Cerrar el formulario con cambios pide confirmación.
3. **Mobiliario:** el resumen de AMA-D1 coincide con sus bienes activos.
4. **Centro:** HOR muestra área del terreno 900 m² y las instalaciones eléctricas en «Malo».
5. **Inventario:** con Equipo central y «Todos los centros», la suma de «Cantidad» es 65 (los bienes activos) y la fila de totales de «Necesidad 2027» muestra S/ 11 090 conocidos y 2 bienes sin valorar. El CSV coincide con la tabla. Con Personal del CAR solo se ve AMA.
6. **Servicios:** AMA Luz muestra «Recurrente: 3 interrupciones en 12 meses», antigüedad de 8 años y 5 meses y el aviso «Renovación próxima» (en 46 días), que Inicio enlaza al servicio. El pago sigue sin restablecer el suministro.
7. **Vehículos:** AMA-V01 es operativo y HOR-V01 requiere mantenimiento con S/ 1 800 estimados. El filtro por estado funciona. Un presupuesto de cero o negativo se rechaza.
8. **Itinerarios:** al marcar un vehículo como detenido, registrar un itinerario muestra el aviso sin bloquear.
9. **Cambios sin guardar (P4):** en cada diálogo con formulario (salvo anular), cerrarlo sin escribir no pregunta; escribir y cerrarlo pide «Seguir editando» o «Descartar». En Precio y Atención (que se montan ya abiertos) abrir y cerrar sin tocar nada tampoco pregunta.
10. **Seguridad de AMA:** en la pestaña «Seguridad y mantenimiento» se ven 4 requeridos, 2 activos y «Faltan 2»; AMA-COM-EXT01 con la recarga «Vencida» desde el 20/10/2026 y la fumigación «Por vencer» (20/11/2026, en 21 días). Al registrar una recarga de AMA-COM-EXT01 con próxima fecha futura, el estado pasa a «Al día» y el aviso desaparece de Inicio.
11. **Seguridad de HOR:** dotación completa (2 de 2) y fumigación «Vencida» (05/09/2026). ESP: fumigación «Sin programar» y requeridos «No informado» (los faltantes no se calculan).
12. **Inicio (Equipo central):** aparecen 3 controles vencidos (HOR-V01, fumigación de HOR, AMA-COM-EXT01), 1 por vencer (fumigación de AMA) y «Faltan 2 extintores» en AMA, cada uno con su enlace. El del vehículo abre Vehículos; los demás, el registro en la pestaña del centro, resaltado.
13. **Anulación de un mantenimiento:** anular la recarga más reciente de un extintor devuelve el estado de la anterior; reactivarla lo restablece. El historial del bien muestra los mantenimientos vigentes.
14. **Tablero (Equipo central):** KPI de 3 centros, 3 controles vencidos y 1 por vencer, 2 extintores faltantes, 6 de 65 bienes en mal estado y 1 vehículo con atención (S/ 1 800). AMA: 28 bienes activos y 3 en mal estado, servicios con 2 pendientes, 1 interrupción abierta, 1 renovación y 1 recurrente. Cada celda abre el detalle correspondiente.
15. **Consulta por equipo:** con «Extintor PQS 6 kg», AMA tiene 2 (control «Vencido», 1 vencido), HOR tiene 2 («Al día», último mantenimiento 10/09/2026) y ESP «No tiene este equipo»; «2 de 3 centros tienen este equipo». Con «Camarote», los tres centros tienen unidades con control «Sin programar».
16. **Accesos:** Personal del CAR no ve «Tablero de control»; Verificación física y Chofer no ven Inventario ni Tablero ni «Registrar mantenimiento».
17. **Anchos** de 390, 768 y 1280 px: sin desbordamiento horizontal y con tarjetas en móvil.
18. **SPEC 001 §8:** sus valores no cambian (9 necesidades, S/ 11 090). Los bienes verificados de Inicio varían porque se añadieron 4 extintores sin verificar.
