# SPEC 005 — Navegación contextual, captura rápida y acciones desde el pendiente

> Actualización: la [SPEC 016](016-incidencias-origen-reposicion-individual.md) sustituye la selección de ubicación y la decisión global de reposición por un origen fijo y evaluación individual. Las reglas patrimoniales permanecen vigentes.

- **Estado:** implementado en el prototipo. La verificación en navegador está pendiente de autorización.
- **Fecha:** 2026-11-03
- **Origen:** diagnóstico ejecutivo de SIGREC (hallazgos L01–L13) y plan priorizado P0–P6.
- **Complementa:** SPEC 001 §8 (valores que no cambian), SPEC 003 (mantenedores) y SPEC 004 (Incidencias). Donde difieran, prevalece esta SPEC.
- **Ampliada por:** [`010-fichas-planificacion-y-estado-operativo.md`](010-fichas-planificacion-y-estado-operativo.md) (antigüedad, renovación y recurrencia en la ficha del servicio; inventario para planificación). Los indicadores gerenciales y la gestión de personal siguen fuera de alcance.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios** y esta es su **primera versión**.
- El estado vive en memoria (`src/services/datos.js`) y se pierde al recargar.
- No hay backend, persistencia ni autorización de servidor. Los permisos por perfil son controles de interfaz y no constituyen seguridad.
- Lo resuelto en la SPEC 004 se reutiliza y no se vuelve a implementar:
  - Centro → Ambiente → Bien.
  - Herencia del centro.
  - Condición por bien.
  - Fecha propia de reposición.
  - Selección individual de componentes.
  - «Siguiente paso».
  - Filtros de ambiente y necesidad.
- La fecha 30/10/2026 es la fecha de corte de la demostración.

## 1. Decisiones confirmadas

| # | Decisión |
| --- | --- |
| 1 | **Antes de inactivar (anular) un ambiente se deben reubicar o resolver sus bienes.** No se dan de baja bienes automáticamente ni se borran antecedentes. |
| 2 | En la interfaz, «componentes asociados» designa piezas de otro bien y «bienes del ambiente» designa el inventario directo del ambiente. |
| 3 | Alcance: P0–P5 y las ampliaciones de modelo de P6. La persistencia y la autorización de servidor quedan fuera. |
| 4 | Se conservan las reglas y los permisos vigentes. Los ejemplos de la reunión no aprueban tablas oficiales de vida útil, indicadores gerenciales, integración SGD ni gestión de personal. |

## 2. Trazabilidad

| ID | Regla | Implementación |
| --- | --- | --- |
| L01 | Cada aviso abre el registro y el período exactos. Si el id no existe o está fuera del ámbito, se muestra «Registro no disponible» y no se selecciona otro registro. | `InicioPage › avisos`, `utils/navegacion › registroSolicitado`, `RegistroNoDisponible`; parámetros `hecho`, `itinerario`, `servicio`/`anio`/`periodo`, `novedad`, `vehiculo`, `tipo` |
| L02 | El alta breve pide Ambiente, Tipo, Condición, Adquisición (año **o** mes) y Cantidad. Los demás datos van en «Datos adicionales». Se muestra el precio referencial del catálogo con su procedencia, sin confundirlo con el costo original. | `RegistroBienPage`, `CampoAdquisicion` |
| L03 | El ambiente tiene Bloque y Ubicación opcionales, sin un nivel adicional «Local». Su ficha muestra datos, galería, bienes del ambiente, novedades e intervenciones. Las fotos llevan un `ambienteId` opcional: las que no lo tienen se tratan como fotos del centro. | `AmbienteDialog`, `AmbientesPage`, `GaleriaFotos`, `registrarFoto` |
| L04 | El servicio tiene el teléfono y el contacto del proveedor. Para un período pendiente se registran motivo, detalle y vencimiento. Para uno pagado, fecha, importe y sustento, todos opcionales. «Sin información» no es deuda y el pago no restablece el servicio. | `ServicioDialog`, `PeriodoDialog`, `informarPeriodo`, `servicios.js › celdasDelAnio` |
| L05 | Cada necesidad ofrece «Ver antecedente» y «Siguiente paso». Sin permiso se indica quién debe actuar. | `NecesidadesPage`, `bienes.js › siguientePaso` |
| L06 | Los filtros se restauran al volver con «Atrás», junto con la posición de desplazamiento. | `useEstadoNavegacion` (`history.state`), `router › scrollBehavior` |
| L07 | Salir de un formulario modificado pide «Seguir editando» o «Descartar». | `useBorrador`, `FormDialog › modificado` |
| L08 | El filtro es «Clasificación principal» y la precedencia se explica: el incidente prevalece sobre la vida útil. Se conservan todos los motivos y cada bien cuenta una sola vez. | `NecesidadesPage`, `necesidades.js` |
| L09 | En móvil, las tablas anchas pasan a tarjetas con las acciones visibles. Vehículos e Itinerarios hacen lo mismo también en tableta. | Ambientes, Precios, Vehículos, Itinerarios, Combustible |
| L10 | Sin recorridos elegibles, el formulario explica la causa y ofrece informar la ejecución. Un recorrido sin consumo abre el registro con ese recorrido. La falta de rendimiento abre el vehículo exacto, con enlace de vuelta al recorrido. | `CombustibleDialog`, `ItinerariosPage`, `VehiculosPage` |
| L11 | El selector rotula «bienes elegibles» y los plurales salen de `plural()`. | `SelectorUbicacionBien`, `bienes.js`, otros |
| L12 | Se mantienen visibles los límites del prototipo: las fotos solo se conservan durante la sesión y los permisos son provisionales. | `FotoDialog`, §0 |
| L13 | El ambiente no se anula mientras tenga bienes activos o con revisión pendiente, componentes asociados incluidos. Se listan con acciones individuales: reubicar (el conjunto conserva su asociación), dar de baja, cerrar revisión y ver ficha. El servicio repite la validación. | `pendientesDeAmbiente`, `anularAmbiente`, `PendientesAmbienteDialog` |

## 3. Reglas de datos (compatibles con los registros existentes)

La galería de centros y ambientes presenta miniaturas 4:3, visor accesible con navegación y descarga individual del archivo original. Las imágenes sin archivo o con error muestran «Imagen no disponible». El nombre de archivo es opcional y las imágenes se conservan en memoria durante la sesión.

El visor compartido usa los colores institucionales, una zona neutra para la imagen y cabecera y pie fijos. Su ancho se adapta al escritorio y ocupa la pantalla en móvil; mantiene controles accesibles por teclado y gestos táctiles.

- Todos los campos nuevos son opcionales:
  - `ambiente.bloque` y `ambiente.ubicacion`.
  - `foto.ambienteId`.
  - `servicio.contacto` (`{ telefono, nombre }`).
  - `pendientes[i].motivo` y `pendientes[i].detalle`.
  - `periodos[anio].pagos[numero]` (`{ fecha, importe, sustento }`).
  - `motivo.eventoId`.
- Un registro anterior sin estos campos se sigue leyendo y no se regenera ningún identificador.
- `adquisicion.fecha` admite `'AAAA'` (año conocido) o `'AAAA-MM'`. Un año conocido no se convierte en enero.
- Las reglas críticas también se validan en `services/acciones.js`:
  - Anular un ambiente con pendientes.
  - Reponer un bien que no está dado de baja o que ya fue repuesto.

## 4. ⚠️ Por validar con el jefe de proyecto

- **Bajas pendientes de reposición.** Necesidades las informa en una sección aparte que **no suma** al total, para que la SPEC 001 §8 no cambie. Falta confirmar si deben contar.
- **Revisión pendiente.** Un bien con revisión pendiente bloquea la inactivación del ambiente (propuesta vigente).
- **Precedencia.** «Reposición por incidente prevalece sobre renovación por vida útil» es una regla provisional.

## 5. Fuera de alcance

- Persistencia, autorización en la capa de datos y control de concurrencia. Son deuda técnica antes de cualquier uso operativo.
- Integración SGD, carga documental del sustento de pago, gestión de personal y choferes, indicadores gerenciales, aprobación presupuestal y compras.
- Rediseño de menús. *(Reemplazado por la SPEC 008 solo para «Gestión de centros».)*

## 6. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

1. **Avisos de Inicio:** el de incendio abre EV-003, el de IT-0233 abre IT-0233 y el pendiente de Luz abre SRV-AMA-LUZ con su período.
2. **Id inexistente:** un enlace con un id que no existe muestra «Registro no disponible».
3. **Volver a Necesidades:** con Reposición filtrada, abrir la silla y volver con «Atrás» conserva el filtro y la posición.
4. **Alta con cambios sin guardar:** escribir un nombre y pulsar Inicio pide confirmación; «Seguir editando» conserva lo escrito.
5. **Alta breve:** con un año conocido se guarda `'2019'`. «Registrar otro» conserva el ambiente y se ve el precio referencial (o «Sin valorar»).
6. **Galería:** una foto del ambiente A no aparece en el ambiente B.
7. **Inactivación:** un ambiente con bienes bloquea la anulación y lista los pendientes sin cambiar nada. Una vez resueltos, se anula y conserva el historial.
8. **Valoración:** la silla sin precio abre la valoración de su tipo. AMA-D1-C02-S muestra ambos motivos y cuenta una vez. El CSV coincide con la selección.
9. **Período:** desde la celda se ven el motivo y el contacto, y el pago no cierra la interrupción.
10. **Movilidad:** sin recorridos elegibles se explica la causa y se ofrece una salida. HOR-V01 completa el rendimiento y vuelve al recorrido.
11. **Ancho:** a 390, 768 y 1280 px no hay desbordamiento horizontal de la página.
12. **SPEC 001 §8:** sus valores no cambian (9 necesidades, S/ 11 090).
