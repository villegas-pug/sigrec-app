# SPEC 009 — Responsabilidad sobre el combustible

- **Estado:** implementado en el prototipo. La verificación en navegador está pendiente de autorización.
- **Fecha:** 2026-11-04
- **Origen:** el chofer podía informar combustible pero no corregir sus errores, y los registros no guardaban quién los informó.
- **Complementa:** SPEC 003 §4 (permisos por acción). Donde difieran, prevalece esta SPEC.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios**; el estado vive en memoria y los permisos por perfil son controles de interfaz.
- No cambian las reglas de combustible de la SPEC 001: carga ≠ consumo, cada consumo se asocia a un solo recorrido y la estimación es orientativa.

## 1. Decisiones confirmadas

Segregación de funciones: quien informa el hecho no es quien lo valida o lo anula.

| Rol | Responsabilidad | Acciones |
| --- | --- | --- |
| **Chofer** | Informa sus cargas y el consumo de sus recorridos, con su sustento. | Informar. Actualizar **solo los registros que informó**, mientras estén vigentes. |
| **Personal del CAR** | Responsable del combustible del centro: revisa lo informado contra vales y comprobantes. | Informar, actualizar y anular cualquier registro, con motivo. |
| **Equipo central** | Supervisa todos los CAR y compara rendimientos. | Acceso total, por ser el administrador del prototipo (SPEC 003 §4). |

## 2. Modelo de datos

- `combustible`: nuevo campo `informadoPor` (nombre del perfil que informó el registro), igual que en `eventos` y `novedades`.
- `registrarCombustible` lo fija con `autorActual()`. `actualizarCombustible` lo conserva: corregir no cambia la autoría.
- Los datos de demostración lo incluyen: CB-002 y CB-004 son del Chofer; CB-001, CB-003 y CB-005, del Personal del CAR.

## 3. Permisos

| Acción | Central | CAR | Verificación | Chofer |
| --- | :-: | :-: | :-: | :-: |
| `combustible.informar` | ✓ | ✓ | | ✓ |
| `combustible.actualizar` (cualquier registro) | ✓ | ✓ | | |
| `combustible.actualizarPropio` (solo lo que informó el perfil activo) | ✓ | | | ✓ |
| `combustible.anular` | ✓ | ✓ | | |

Convención: `entidad.actualizarPropio` permite actualizar solo los registros vigentes cuyo autor es el perfil activo.

## 4. Interfaz

| Regla | Implementación |
| --- | --- |
| «Actualizar registro» se ofrece si el registro está vigente y el perfil tiene `combustible.actualizar`, o tiene `combustible.actualizarPropio` y es su autor. | `CombustiblePage.vue › puedeActualizar` |
| La tabla y las tarjetas móviles muestran «Informado por» (o «—» si no hay autor). | `CombustiblePage.vue` |

## 5. ⚠️ Por validar con el jefe de proyecto

- **Validación formal.** Una acción `combustible.validar` del CAR que bloquee para el chofer los registros ya validados. No se implementa hasta confirmar que el CAR concilia contra vales.
- **Entrega del combustible.** Si el CAR emite vales y el chofer carga en el grifo, o si el chofer paga y luego rinde cuentas.
- **Identidad del autor.** Se identifica por el nombre del perfil (`services/autor.js`), porque el chofer no es una entidad. En producción debe ser el usuario autenticado.

## 6. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

1. Chofer → Combustible (AMA-V01): «Actualizar registro» solo en CB-002 y CB-004; sin «Anular» ni «Reactivar».
2. El chofer informa una carga: la columna muestra «Chofer», puede actualizarla y al guardar se conserva el autor.
3. El chofer cambia la cantidad de CB-004: «Comparación por recorrido» refleja el nuevo consumo de IT-0231.
4. Personal del CAR actualiza y anula todos los registros, incluidos los del chofer.
5. Móvil 390 px: las tarjetas muestran «Informado por», sin desbordamiento horizontal.
6. SPEC 001 §8 sin cambios.
