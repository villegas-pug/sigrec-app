# SPEC 010 — Fichas ampliadas, inventario para planificación y estado operativo de vehículos

- **Estado:** P0, P1 y P4 implementados en el prototipo. P2 (control preventivo) y P3 (vista ejecutiva) quedan planificados, sin implementar. La verificación en navegador está pendiente de autorización.
- **Fecha:** 2026-11-09
- **Origen:** reunión con la jefa de unidad y el jefe de proyecto del 30/10/2026 ([aportes funcionales](../reuniones/2026-10-30_1234_reunion-jefa-unidad-jefe-proyecto/2026-10-30_1234_transcripcion_reunion-jefa-unidad-jefe-proyecto.md)) contrastada con el prototipo y las SPEC 001–009.
- **Complementa:** SPEC 003 (mantenedores), SPEC 005 (servicios y captura rápida) y SPEC 008 (fichas del explorador). Donde difieran, prevalece esta SPEC.
- **Reemplaza:** SPEC 003 §8 únicamente en el punto «estado de vehículos (SOAT, revisión técnica, odómetro)»: el **estado operativo y el presupuesto de mantenimiento** pasan a estar dentro del alcance. SOAT, revisión técnica y odómetro siguen fuera.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios**; el estado vive en memoria y los permisos por perfil son controles de interfaz (SPEC 005 §0).
- Las propuestas de la reunión son contexto, no autorización por sí mismas. Esta SPEC implementa solo lo que amplía funcionalidades ya existentes (P1). Lo nuevo (P2 y P3) requiere priorización con las direcciones de los centros.
- Todos los campos nuevos son **opcionales** y compatibles con los registros existentes: un registro sin ellos se sigue leyendo y se presenta como «No evaluado» o «No informado», nunca como bueno ni como cero.
- No cambian las reglas de necesidades ni los valores de la SPEC 001 §8 (9 necesidades, S/ 11 090).
- **Turnos y personal por centro** queda fuera de alcance (SPEC 005 §5; el audio no permite precisar qué se espera gestionar). Solo se registra como pregunta en el cuestionario de validación.

## 1. Decisiones

| # | Decisión |
| --- | --- |
| 1 | El estado de la infraestructura se registra **por elemento** (puertas, ventanas, pintura, pisos, techo, estructura, instalaciones eléctricas y sanitarias), tanto en el ambiente como en la construcción del centro. La lista es provisional. |
| 2 | El **mobiliario y los equipos de un ambiente no se capturan aparte**: su estado se calcula con los bienes activos del ambiente (los componentes cuentan como bienes). |
| 3 | El inventario orientado a planificación es un **reporte** sobre los datos existentes, no un nuevo registro. Reutiliza `calcularNecesidades`. |
| 4 | Los **problemas recurrentes** de un servicio se derivan de sus hechos de interrupción; no son un dato capturado. |
| 5 | El estado operativo de un vehículo y su presupuesto estimado son **datos de la ficha del vehículo**. El presupuesto solo suma si se informó. |

## 2. Trazabilidad

| ID | Reunión | Implementación |
| --- | --- | --- |
| F1 | Ficha de centros y ambientes: área, propio o alquilado, estado de la infraestructura; condición física del ambiente (puertas, pintura, estructura) [01:14–02:44] | **Ya existía:** área construida, condición propio/alquilado, estado general. **Nuevo:** área del terreno, estado por elemento y resumen del mobiliario. `CentroFichaDialog`, `AmbienteDialog`, `DetalleCentro`, `DetalleAmbiente`, `EstadoElementos`, `services/infraestructura.js` |
| F2 | Inventario: cantidades por tipo, condición y valor aproximado para proyectar compras [02:44–03:21; 05:17–05:41] | **Ya existía:** captura breve, cantidad, condición y adquisición. **Nuevo:** pantalla «Inventario para planificación». `InventarioPage`, `services/inventario.js`, `utils/csv.js` |
| F3 | Servicios: antigüedad, renovación y problemas recurrentes [05:41–06:31; 08:41–09:10] | **Ya existía:** períodos, pagos, contacto y hechos de suministro. **Nuevo:** inicio, renovación, avisos y recurrencia. `ServicioDialog`, `ServiciosPage`, `services/servicios.js` |
| F4 | Vehículos: operativos frente a detenidos y presupuesto de mantenimiento [04:46–05:14] | **Nuevo:** estado operativo, mantenimiento y resumen. `VehiculoDialog`, `VehiculosPage`, `ItinerarioDialog`, `services/vehiculos.js` |
| F5 | Control preventivo (fumigación, extintores) [00:00–00:44] | **P2, sin implementar.** Ver §7. |
| F6 | Vista ejecutiva para varios centros [00:00–00:44; 03:27–05:14] | **P3, sin implementar.** Ver §7. |
| F7 | Turnos y personal por centro [06:58–07:26] | **Fuera de alcance.** |

## 3. Modelo de datos

- `ambiente.estadoElementos?: { [elemento]: condicion }` y `car.inmueble.construccion.estadoElementos?` con la misma forma. Solo se guardan los elementos evaluados; sin ninguno se guarda `null`. Catálogo: `ELEMENTOS_INFRAESTRUCTURA` en `config/catalogos.js`.
- `car.inmueble.construccion.areaTerrenoM2?`: número, distinto del área construida.
- `servicio.inicio?`: `'AAAA'` o `'AAAA-MM'` (mismo criterio de precisión que la adquisición de un bien: un año conocido no se convierte en enero).
- `servicio.renovacion?: { fecha, detalle }`.
- `vehiculo.estadoOperativo?`: `operativo | requiereMantenimiento | detenido`. Catálogo: `ESTADOS_VEHICULO`.
- `vehiculo.mantenimiento?: { motivo, presupuestoEstimado, ultimoFecha }`. `motivo` y `presupuestoEstimado` solo aplican si el vehículo requiere mantenimiento o está detenido.

## 4. Reglas

| Regla | Implementación |
| --- | --- |
| Un elemento sin evaluar se muestra «No evaluado»; no se asume bueno. | `EstadoElementos` |
| Un elemento en condición mala o inservible sugiere registrar una novedad, pero **no la crea**: la novedad sigue siendo el hecho. | `EstadoElementos › elementosCriticos` |
| El resumen de mobiliario cuenta los bienes activos ponderados por cantidad; sin condición se cuenta como «No constatable». | `infraestructura.js › conteoPorCondicion` |
| El inventario cuenta solo bienes activos. El valor aproximado es precio referencial × cantidad; las unidades sin precio se informan aparte y una fila sin ningún precio queda «Sin valorar», nunca en cero. | `inventario.js › resumenInventario`, `estadoValoracion` |
| La necesidad del año del inventario sale de `calcularNecesidades`, de modo que coincide con la pantalla Necesidades. | `inventario.js` |
| Un servicio es **recurrente** con 3 o más interrupciones vigentes en los últimos 12 meses (umbral provisional). | `servicios.js › problemasRecurrentes`, `config/demo.js › PARAMETROS_SERVICIOS` |
| La antigüedad se calcula con `inicio` a la fecha de corte; con solo el año no se muestran meses. Sin `inicio`: «Antigüedad no informada». | `servicios.js › antiguedadServicio` |
| Una renovación a 60 días o menos de la fecha de corte genera el aviso «Renovación próxima»; una fecha ya pasada, «Renovación vencida». El aviso no cuenta como pago pendiente ni altera «Al día». | `servicios.js › estadoRenovacion`, `avisosDeServicios` |
| Un vehículo sin estado informado no cuenta como operativo. El presupuesto estimado suma solo los vehículos que requieren atención y lo informaron; el resto se cuenta como «sin estimar». | `vehiculos.js › resumirEstadoVehiculos` |
| Registrar un itinerario de un vehículo detenido muestra un aviso, pero **no lo bloquea** (regla por validar). | `ItinerarioDialog` |
| La exportación a CSV es común a Necesidades e Inventario. | `utils/csv.js › exportarCsv` |

## 5. Permisos y accesos

No hay acciones nuevas: el estado por elemento se edita con `centro.actualizar` y `ambiente.actualizar`; los datos de servicio, con `servicio.actualizar`; los del vehículo, con `vehiculo.actualizar`.

- La pantalla **Inventario para planificación** (`inventario`, grupo «Necesidades y presupuesto») es accesible para Equipo central (acceso total) y Personal del CAR, limitada a su ámbito. Verificación física y Chofer no la ven. ⚠️ Por validar.

## 6. ⚠️ Por validar con el jefe de proyecto y las direcciones de los centros

El detalle está en el [cuestionario de validación](../reuniones/2026-10-30_1234_reunion-jefa-unidad-jefe-proyecto/2026-10-30_1234_cuestionario_validacion-campos.md).

- Lista de elementos de infraestructura a evaluar y si debe diferir entre centro y ambiente.
- Umbral de recurrencia (3 interrupciones en 12 meses) y anticipación del aviso de renovación (60 días).
- Catálogo de servicios (la reunión menciona electricidad, internet, gas y fumigación) y qué datos de renovación se necesitan.
- Criterio de «detenido» frente a «requiere mantenimiento» y cómo se estima el presupuesto.
- Si el valor aproximado del inventario debe usar el precio referencial del catálogo o el costo de adquisición.
- Qué indicadores debe tener la vista ejecutiva y quién la usa.
- Qué se espera gestionar con turnos y personal por centro (incluidos los PAM).

## 7. Siguientes fases (sin implementar)

- **P2 — Control preventivo y mantenimientos.** Un único registro de mantenimientos y controles (fumigación, recarga de extintores, mantenimiento de equipos y vehículos). Los extintores serían bienes de un tipo nuevo; los faltantes se calcularían contra una dotación requerida por centro. Avisos de «por vencer» y «vencido». Requiere responsables y periodicidades oficiales.
- **P3 — Vista ejecutiva de control.** Matriz por centro y consulta por equipo («¿qué centros tienen X y en qué estado?»), reutilizando el inventario, los mantenimientos y el resumen de vehículos. Los indicadores gerenciales figuran fuera del alcance de la SPEC 001 y requieren priorización.
- **Deuda resuelta (P4).** Los diálogos de registrar centro, actualizar ficha del centro, novedad, intervención, atención, tipo de bien, precio y hecho de servicio ahora piden «Seguir editando» o «Descartar» al cerrarlos con cambios sin guardar (SPEC 005 L07, `useBorrador`). `AnularDialog` queda fuera: es una confirmación explícita con su propio botón de cancelar.

## 8. Riesgos

- El estado de la infraestructura de un CAR y la dirección del inmueble son datos sensibles para la protección de NNA (SPEC 003 §9): en la fase real requieren acceso restringido.
- El valor aproximado no es valor contable ni aprueba compras.
- El estado operativo y el presupuesto de un vehículo no están respaldados por un documento; en producción deberían vincularse a una orden o cotización.

## 9. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

1. **Ambiente sin estado:** un ambiente sin `estadoElementos` muestra los ocho elementos como «No evaluado». En AMA-D1 se ven las ventanas en «Malo» con la sugerencia de registrar una novedad.
2. **Edición:** al actualizar el ambiente, dejar un elemento vacío lo guarda como no evaluado. Cerrar el formulario con cambios pide confirmación.
3. **Mobiliario:** el resumen de AMA-D1 coincide con sus bienes activos (los dos colchones y la silla suman por cantidad).
4. **Centro:** HOR muestra área del terreno 900 m² y las instalaciones eléctricas en «Malo».
5. **Inventario:** con Equipo central y «Todos los centros», la suma de «Cantidad» coincide con los bienes activos. La fila de totales de «Necesidad 2027» muestra S/ 11 090 conocidos y 2 bienes sin valorar, y el CSV suma 9 bienes con necesidad (SPEC 001 §8). El CSV coincide con la tabla. Con Personal del CAR solo se ve AMA.
6. **Servicios:** AMA Luz muestra «Recurrente: 3 interrupciones en 12 meses», antigüedad de 8 años y 5 meses y el aviso «Renovación próxima» (en 46 días), que Inicio enlaza al servicio. El pago sigue sin restablecer el suministro.
7. **Vehículos:** AMA-V01 es operativo y HOR-V01 requiere mantenimiento con S/ 1 800 estimados. El filtro por estado funciona. Un vehículo sin estado figura como «No informado». Un presupuesto de cero o negativo se rechaza.
8. **Itinerarios:** al marcar un vehículo como detenido, registrar un itinerario muestra el aviso sin bloquear.
9. **Anchos** de 390, 768 y 1280 px: sin desbordamiento horizontal y con tarjetas en móvil.
10. **SPEC 001 §8:** sus valores no cambian (9 necesidades, S/ 11 090).
11. **Cambios sin guardar (P4):** en cada uno de los ocho diálogos, abrirlo sin escribir y cerrarlo no pregunta nada; escribir un dato y cerrarlo pide confirmación; «Seguir editando» conserva lo escrito y «Descartar» lo pierde. Tras guardar o reabrir, el formulario vuelve a estar «sin cambios». En Precio y Atención (que se montan ya abiertos) abrir y cerrar sin tocar nada tampoco pregunta.
