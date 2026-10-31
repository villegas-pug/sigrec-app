# SPEC 001 — Prototipo funcional de SIGREC

- **Estado:** en implementación
- **Fecha:** 2026-10-30
- **Origen:** brief «SIGREC — Sistema Integrado de Gestión de Recursos de Centros» y lienzo de diseño aprobado para implementación (`https://claude.ai/artifact/XFmGXDQS6jyyPaPXFFMVfS`).
- **Observaciones incorporadas:** (1) los perfiles deben tener accesos distintos; (2) cabecera, menú y submenús con el diseño de la referencia `https://rcgv-services-dev.duckdns.org/uspnna/#/inicio`; (3) pendientes del diseño: filtrar datos por ámbito del perfil y alinear título, migas y botones con la referencia.

## 1. Objetivo

Construir un prototipo navegable en Vue 3 + Quasar que permita al jefe de proyecto validar los seis módulos de SIGREC con datos ficticios en JSON, sin backend ni persistencia.

## 2. Alcance

| Incluye | No incluye |
| --- | --- |
| 11 pantallas: Inicio, Centros y locales, Ambientes, Bienes del CAR, Registro y verificación, Incidencias, Necesidades, Precios referenciales, Servicios básicos y pagos, Vehículos e itinerarios, Combustible. | Backend, autenticación real, persistencia (los cambios viven en memoria hasta recargar). |
| Perfiles de demostración con accesos y ámbitos de datos distintos. | Expedientes de NNA, control patrimonial formal, ejecución de pagos o compras. |
| Reglas de negocio calculadas sobre los datos (necesidades, períodos, combustible). | Priorización presupuestal (se muestra como ampliación posterior). |
| Acciones en memoria: registrar bien, verificación, incidente, baja, reposición, novedad, precio, pago/pendiente, interrupción/restablecimiento, itinerario, combustible. | Mapas o seguimiento vehicular. |

## 3. Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `@quasar/app-vite` 2.4.1 + `quasar` 2.35.0 + `vue` 3.5.43 + `vue-router` 5.3.1. | El equipo usa Node 22.17.1. `@quasar/app-vite` 3.x y 2.5.0–2.6.x exigen Node ≥ 22.22 en su verificación de arranque; 2.4.1 es la última que acepta 22.17 (Vite 7). Versiones fijadas. |
| Sin Pinia: estado reactivo en `src/services/datos.js` y `src/composables/usePerfil.js`. | YAGNI: un único almacén en memoria y un perfil activo. |
| Reglas de negocio en funciones puras en `src/services/` (sin dependencias de UI). | Facilita pruebas futuras y evita lógica duplicada en páginas. |
| Accesos por nombre de ruta; el layout muestra «sin acceso» si el perfil no puede ver la ruta. | Un solo punto de control; el menú y la vista usan la misma regla. |
| Perfil activo guardado en `localStorage` (`sigrec.perfil`) con `try/catch`. | Conservar el perfil al recargar; tolera almacenamiento bloqueado. |
| Fecha de corte fija `2026-10-30` y año de revisión 2027 en `src/config/demo.js`. | Demostración reproducible con independencia del reloj. |
| Armazón (cabecera, menú, pie, título, migas, botones, tablas) replicado de la referencia con sus medidas y colores. | Observación 2. |

## 4. Perfiles provisionales (⚠️ por validar)

| Perfil | Rutas | Ámbito de datos |
| --- | --- | --- |
| Equipo central USPNNA | Todas salvo «Registro y verificación» | Todos los CAR |
| Personal del CAR | Todas salvo «Precios referenciales» | CAR Demo Amanecer |
| Verificación física | Bienes del CAR, Registro y verificación, Incidencias | CAR Demo Amanecer |
| Chofer | Vehículos e itinerarios, Combustible | Vehículo AMA-V01 |

## 5. Modelo de datos (`src/data/*.json`)

`cars`, `locales`, `ambientes` (con `novedades` e `intervenciones`), `bienes` (con `asociadoA`, `adquisicion`, `vidaUtilAnios`, `verificacion`), `tipos-bien` (precio referencial), `eventos` (daño, robo, incendio, baja, reposición, verificación, condición), `servicios` (períodos pagados y pendientes, hechos de suministro), `vehiculos`, `itinerarios`, `combustible`, `inventario-previo`.

## 6. Reglas implementadas

| Regla | Implementación |
| --- | --- |
| Una necesidad por bien con todos sus motivos (vida útil e incidentes). | `services/necesidades.js › calcularNecesidades` |
| Vida útil cumplida si `año de adquisición + vida útil ≤ año revisado`. Sin fecha o sin vida útil: «antecedentes insuficientes», sin renovación calculada; la necesidad por incidente se mantiene. | `finVidaUtil`, `antecedentesFaltantes` |
| Solo bienes activos generan necesidad; la reposición registra la necesidad como atendida y no suma. | `calcularNecesidades` |
| Importe = precio referencial × cantidad; sin precio → «sin valorar», nunca cero. | `calcularNecesidades`, `totalizar` |
| Infraestructura que requiere evaluación se lista sin costo. | `calcularNecesidades › infraestructura` |
| Período sin registro y ya vencido = «sin información», no pendiente; vencimiento solo con fecha. | `services/servicios.js › celdasDelServicio` |
| Interrupción abierta = último hecho de suministro es interrupción; un pago no restablece. | `interrupcionAbierta` |
| Carga ≠ consumo; estimación = km realizados ÷ rendimiento; sin base → no comparable, sin conclusiones. | `services/combustible.js › evaluarItinerario` |
| La baja de una cama no da de baja sus colchones: se listan para revisión individual. | `BienAccionDialog` (modo baja), `IncidenciasPage` |
| Un incidente afecta solo los bienes informados. | `IncidenciasPage` (afectados vs no reportados) |

## 7. Trazabilidad RF → pantalla

| RF | Pantalla |
| --- | --- |
| RF-01, RF-08, RF-09 | Bienes del CAR (árbol, asociaciones, verificación) |
| RF-02, RF-03, RF-04, RF-07 | Registro y verificación; ficha del bien |
| RF-05, RF-06, RF-21 | Necesidades; Precios referenciales; Inicio |
| RF-10, RF-11 | Centros y locales |
| RF-12 | Ambientes |
| RF-13, RF-14, RF-15 | Servicios básicos y pagos |
| RF-16, RF-17, RF-18 | Vehículos e itinerarios; Combustible |
| RF-19, RF-20 | Incidencias; acciones de la ficha del bien |

## 8. Criterios de aceptación cubiertos con los datos de demostración

CA-01 a CA-18 del brief. Valores esperados para 2027 con perfil Equipo central: 9 necesidades pendientes, S/ 11 090 de importe conocido, 2 sin valorar, 2 de infraestructura en evaluación, 1 atendida por reposición; CAR Demo Amanecer: 3 necesidades, S/ 1 300, 1 sin valorar.

## 9. Riesgos y deuda técnica

- **Sin persistencia:** los cambios se pierden al recargar. Aceptable para el prototipo; la siguiente fase requiere API.
- **Accesos solo en cliente:** no son seguridad; la autorización real debe residir en el backend.
- **Sin pruebas automatizadas:** las reglas están aisladas en `services/` para añadir pruebas unitarias.
- **Logo oficial pendiente:** se usa el mismo marcador de posición que la referencia.

## 10. Tareas

1. Estructura Quasar (config, router, estilos base y variables). ✅
2. Configuración de dominio: menú, perfiles, catálogos, fecha de corte. ✅
3. Datos JSON ficticios. ✅
4. Servicios de dominio y acciones en memoria. ✅
5. Armazón: cabecera, menú, pie, sin acceso, encabezado de página. ✅
6. Páginas de los seis módulos. ✅
7. Verificación (`npm install`, `quasar dev`, `quasar build`): **pendiente de autorización**.
