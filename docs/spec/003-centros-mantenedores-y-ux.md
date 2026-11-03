# SPEC 003 — Centros sin «Local», mantenedores completos, trazabilidad y UI adaptable

- **Estado:** implementado en el prototipo (verificación en navegador pendiente de autorización)
- **Fecha:** 2026-11-02
- **Origen:** revisión integral del prototipo (SPEC 001 y 002) y aclaraciones del solicitante.
- **Actualizada por:** [`004-incidencias-contexto-y-recorrido.md`](004-incidencias-contexto-y-recorrido.md) (baja y reposición, condición y traslado de componentes).
- **Reemplaza:** de la SPEC 002 §1 («el local se consulta como ficha del inmueble») y §5 («CAR con varios locales»).

## 1. Decisiones confirmadas

| # | Decisión |
| --- | --- |
| 1 | Jerarquía **Centros › Ambientes › Bienes › Componentes**. **El Local queda fuera**: no existe como entidad, nivel ni pantalla. |
| 2 | Los datos del inmueble (dirección, propio o alquilado, arrendador, contrato, litigios, fundación, construcción y fotografías) son la **ficha del centro** (`centro.inmueble`). |
| 3 | Todos los módulos tienen **mantenedores completos**: alta, consulta, edición y baja. |
| 4 | Mantienen Equipo central (todos los CAR) y Personal del CAR (su centro). Verificación física y Chofer conservan solo sus acciones. |
| 5 | La baja es **lógica y con motivo** (`anulacion: { fecha, motivo, por }`): el registro deja de contar en los cálculos, se oculta por defecto y se ve con «Mostrar inactivos». |

## 2. Glosario

| Término | Uso |
| --- | --- |
| **Centro** | La entidad (CAR). «CAR» solo en textos largos o institucionales. |
| **Registrar** | Crear una entidad (centro, ambiente, bien, vehículo, servicio, tipo de bien). |
| **Informar** | Dejar constancia de un hecho (verificación, pago, combustible, ejecución, precio). |
| **Actualizar** | Corregir los datos de un registro existente. |
| **Anular / Reactivar** | Baja lógica con motivo y su reversión. |
| **Dar de baja** | Baja patrimonial de un bien (distinta de anular un registro erróneo). |

## 3. Modelo de datos (cambios)

- `cars.json`: `{ id, nombre, inmueble: { direccion, condicion, arrendador, contratoHasta, litigios, fundacion, construccion, fotos[], actualizado } }`. Se elimina `locales.json`.
- `ambientes`, `servicios` e `inventario-previo`: `localId` → `carId`.
- Cualquier registro puede llevar `anulacion`. Un bien anulado pasa a `situacion: 'anulado'` (con `anulacion.situacionPrevia`).
- Hechos (`eventos`): `fecha` (cuándo ocurrió) y `registradoEl` (cuándo se registró); `unidades` opcional en incidentes de bienes por lote.
- Tipos de bien: `vidaUtilSugerida` opcional e `historial[]` de precios anteriores.

## 4. Permisos por acción (⚠️ por validar)

Convención `entidad.registrar | actualizar | anular`. Central y CAR comparten el mantenimiento; solo Central registra o anula centros y mantiene el catálogo de tipos de bien y sus precios.

| Acción | Central | CAR | Verificación | Chofer |
| --- | :-: | :-: | :-: | :-: |
| `centro.registrar`, `centro.anular` | ✓ | | | |
| `centro.actualizar`, `centro.foto`, `foto.actualizar`, `foto.anular` | ✓ | ✓ | | |
| `ambiente.*`, `novedad.*`, `intervencion.*` | ✓ | ✓ | | |
| `bien.registrar`, `bien.actualizar`, `bien.componente`, `bien.trasladar`, `bien.anular`, `bien.baja`, `bien.reposicion` | ✓ | ✓ | | |
| `bien.verificar`, `bien.incidente` | ✓ | ✓ | ✓ | |
| `incidente.actualizar`, `incidente.anular` | ✓ | ✓ | | |
| `tipoBien.*`, `precio.informar` | ✓ | | | |
| `baja.anular`, `reposicion.anular` | ✓ | | | |
| `servicio.*`, `hecho.*` | ✓ | ✓ | | |
| `vehiculo.*` | ✓ | ✓ | | |
| `itinerario.registrar`, `itinerario.ejecucion` | ✓ | ✓ | | ✓ |
| `itinerario.actualizar`, `itinerario.anular` | ✓ | ✓ | | |
| `combustible.informar` | ✓ | ✓ | | ✓ |
| `combustible.actualizar`, `combustible.anular` | ✓ | ✓ | | |

Equipo central es el perfil de **acceso total** (administrador del prototipo): sus rutas se derivan de `MENU` y sus acciones de `TODAS_LAS_ACCIONES` (`src/config/perfiles.js`), de modo que una pantalla o acción nueva queda cubierta. No existe un perfil Administrador aparte; si se decide acotar a Central, se crea uno con `TODAS_LAS_RUTAS` y `TODAS_LAS_ACCIONES`.

Accesos: Verificación física deja de tener la pantalla «Registro de bienes» (verifica desde la ficha del bien); Equipo central la gana.

## 5. Mantenedores por entidad

| Entidad | Alta | Edición | Anulación | Dependencias que bloquean la anulación |
| --- | :-: | :-: | :-: | --- |
| Centro y ficha | ✓ | nombre y ficha | ✓ | ambientes, vehículos o servicios vigentes |
| Fotografía | ✓ | título, nota, imagen | ✓ | — |
| Ambiente | ✓ | ✓ | ✓ | bienes activos (se ofrece trasladarlos) |
| Novedad / intervención | ✓ | ✓ | ✓ | — |
| Bien / componente | ✓ | ✓ + traslado | ✓ (registro erróneo) | componentes activos |
| Incidente | ✓ (desde Incidencias o ficha) | ✓ | ✓ | — |
| Baja de un bien | ✓ (desde Incidencias o ficha) | — | ✓ (solo Central; registro erróneo) | reposición vigente del bien |
| Reposición | ✓ (desde Incidencias o ficha) | — | ✓ (solo Central; registro erróneo) | componentes propios, hechos posteriores o bien nuevo inactivo |
| Tipo de bien y precio | ✓ | ✓ | ✓ | bienes activos de ese tipo |
| Servicio | ✓ | ✓ (periodicidad sin períodos informados) | ✓ | — |
| Hecho del servicio | ✓ | ✓ | ✓ | — |
| Vehículo | ✓ | ✓ (incluye centro) | ✓ | — |
| Itinerario | ✓ | ✓ | ✓ | consumo declarado vigente |
| Combustible | ✓ | ✓ | ✓ | — (anular un consumo libera el itinerario) |

## 6. Reglas nuevas

| Regla | Implementación |
| --- | --- |
| El autor de un registro es el perfil activo. | `services/autor.js`, `usePerfil` |
| La fecha de un hecho es editable y no puede ser posterior a la fecha de corte. | `utils/validaciones.js`, diálogos |
| Un cambio de condición por incidente deja el antecedente «Condición actualizada». | `acciones.js › cambiarCondicion` |
| Un precio reemplazado se conserva en el historial del tipo. | `informarPrecio` |
| Corregir un período de pago deja un hecho «Corrección de período». | `informarPeriodo` |
| Un incidente sobre parte de un lote cuenta solo las unidades afectadas (regla por validar). | `necesidades.js › unidadesNecesarias` |
| Los incidentes y reposiciones cuentan desde el año en que ocurren. | `calcularNecesidades` |
| La baja de un bien guarda los componentes de ese momento; al reponer se pueden trasladar al bien nuevo. | `darDeBaja`, `registrarReposicion` |
| Anular una baja devuelve el bien a activo; anular una reposición anula el bien nuevo y devuelve sus componentes trasladados al bien anterior. Se revierte en orden inverso: primero la reposición y después la baja. Quien registra el hecho (CAR) no lo revierte: lo hace Equipo central. | `anularBaja`, `anularReposicion`, `dependenciasDeBaja`, `dependenciasDeReposicion` |
| Trasladar un bien lleva a sus componentes; un componente trasladado deja de serlo. | `trasladarBien` |
| Un bien nuevo no hereda la fecha de adquisición del inventario previo. | `RegistroBienPage` |

## 7. UI adaptable

- `FormDialog` / `BaseDialog`: diálogos maximizados en móvil.
- `CondicionSelector`: botones de opción (opción única) en todos los tamaños; SPEC 004.
- Cabecera, KPI y tablas con ajustes para ≤ 599 px; primera columna fija en tablas anchas; períodos de servicio como tarjetas en móvil.
- Foco visible y estado `disabled` en los controles propios.
- En pantallas menores a 1024 px, al seleccionar un bien o un centro la vista baja a su ficha.

## 8. Fuera de alcance (validar con el jefe de proyecto)

Verificación por ambiente en lote, rótulos con código QR, avisos de contrato por vencer y verificaciones antiguas, estado de vehículos (SOAT, revisión técnica, odómetro), importes y comprobantes de servicios, datos institucionales del centro, modo sin conexión, ESLint/Vitest y alojar la fuente localmente (requieren instalar dependencias).

## 9. Riesgos

- Dirección y fotos de la fachada de un CAR son sensibles para la protección de NNA: en la fase real, acceso restringido y eliminación de metadatos EXIF/GPS.
- El campo «Chofer relacionado» guardará datos personales (Ley 29733).
- La autorización sigue siendo solo de cliente.
