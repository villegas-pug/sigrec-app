# SPEC 004 — Incidencias: contexto Centro › Ambiente › Bien y recorrido necesidad → baja → reposición

- **Estado:** implementado en el prototipo (verificación en navegador pendiente de autorización)
- **Fecha:** 2026-11-03
- **Origen:** revisión de UX de Incidencias, bajas y reposiciones con el perfil Equipo central.
- **Complementa:** SPEC 003 §5 y §6 (baja de un bien y reposición). Donde difieran, prevalece esta SPEC.

## 1. Decisiones confirmadas

| # | Decisión |
| --- | --- |
| 1 | Los tres formularios (incidente, baja, reposición) siguen el flujo **Centro → Ambiente → Bien → Datos del hecho → Resumen → Confirmación**. |
| 2 | Cambiar el centro limpia ambiente y bien; cambiar el ambiente limpia el bien. |
| 3 | El centro filtrado en Incidencias se hereda en los formularios. Con «Todos los centros» se pide elegirlo; el ambiente nunca se preselecciona. |
| 4 | **La fecha de corte de la demostración se mantiene** (`FECHA_CORTE`, SPEC 001 §3) y se explicita en cada campo de fecha. No se usa el reloj del equipo. |
| 5 | **La baja sigue siendo obligatoria antes de reponer.** El detalle del incidente muestra el paso pendiente y lo inicia con el bien ya elegido. |

## 2. Reglas nuevas

| Regla | Implementación |
| --- | --- |
| Selección jerárquica reutilizable; los ambientes sin bienes elegibles se muestran deshabilitados con su conteo. | `SelectorUbicacionBien` |
| Cada bien se lista con nombre, rótulo, condición, situación y, si es componente, su bien principal. | `SelectorUbicacionBien` (slot `option`) |
| Estados de necesidad unificados entre listado y detalle: **Pendiente**, **Atendida**, **Sin necesidad reportada**, **Anulado** (y «Sin necesidad abierta» como caso residual). | `IncidenciasPage › estadoDeBien`, `estadoNecesidad` |
| Incidente con necesidad sobre un bien activo → paso «Dar de baja». Sobre un bien dado de baja sin reposición → paso «Registrar reposición». | `IncidenciasPage › pasoDe` |
| La reposición tiene fecha propia (obligatoria, no futura y no anterior a la baja), distinta de la adquisición del bien nuevo. | `BienAccionDialog`, `noAnteriorA` |
| Antes de confirmar una baja se resume ubicación, bien, condición, situación y componentes afectados. | `BienAccionDialog` |
| En la reposición se muestran lado a lado el bien que sale y el que ingresa (destino y posición heredada). | `BienAccionDialog` |
| Los componentes se trasladan **uno por uno**; los no marcados siguen asociados al bien dado de baja, pendientes de revisión. | `registrarReposicion({ componentesIds })` |
| La condición es de **opción única** (botones de opción). En un incidente con varios bienes puede indicarse una condición distinta por bien; el valor por bien prevalece sobre el común. | `CondicionSelector`, `registrarIncidente({ condiciones })` |
| El historial del bien (incidente, baja, reposición) es navegable: pulsar un hecho lo selecciona y, si un filtro lo oculta, los limpia. | `HistorialBien`, `irAHecho` |
| Filtros nuevos: Ambiente (con un centro elegido), Necesidad y «Limpiar filtros». | `IncidenciasPage` |
| Plurales correctos («1 hecho», «2 componentes», «1 bien»). | `plural()` |

## 3. Se conserva

- La advertencia de que la baja no se aplica automáticamente a los bienes asociados.
- La reversión en orden inverso (primero la reposición y después la baja) y que solo Equipo central anula.

## 4. ⚠️ Por validar con el jefe de proyecto

- Que reponer un bien activo exija darlo de baja antes (regla funcional vigente). Alternativa descartada: baja y reposición en un solo paso.
- Que un componente no trasladado quede asociado al bien dado de baja.
- Que la condición por bien sea opcional y no reemplace la condición común.

## 5. Fuera de alcance

Persistencia y validaciones del servidor, permisos de otros perfiles (siguen siendo provisionales) y uso de la fecha real del equipo.

## 6. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

1. Con Horizonte filtrado, «Registrar incidente» abre en Horizonte sin ambiente elegido.
2. Con «Todos», «Dar de baja» pide centro y ambiente antes de ofrecer bienes y muestra el resumen con la ubicación.
3. Incidente «Pata rota»: Pendiente → «Dar de baja» → Pendiente con paso «Registrar reposición» → Atendida.
4. Reposición de `AMA-D2-C04`: trasladar solo un colchón; el otro sigue en el bien dado de baja. Anular la reposición lo devuelve.
5. Incidente con dos bienes y condición por bien: cada uno queda con su condición y un antecedente «Condición actualizada».
6. Filtros Ambiente y Necesidad, «Limpiar filtros» y etiquetas en singular.
7. Los valores de la SPEC 001 §8 no cambian.
