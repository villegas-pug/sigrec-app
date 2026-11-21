# SPEC 002 — Acciones faltantes y jerarquía Centro › Ambiente › Bien › Componente

- **Estado:** implementado en el prototipo
- **Actualizada por:** [`003-centros-mantenedores-y-ux.md`](003-centros-mantenedores-y-ux.md) (centros sin «Local», mantenedores completos, permisos y UI adaptable). Donde difieran, prevalece la SPEC 003.
- **Fecha:** 2026-10-30
- **Origen:** revisión del prototipo (SPEC 001) desde la perspectiva del usuario final. Observaciones del solicitante: «Movilidad no permite registrar vehículos» y «la organización jerárquica debe ser centros, ambientes y bienes (componentes)».

## 1. Decisiones confirmadas

| Decisión | Detalle |
| --- | --- |
| Jerarquía | Centro › Ambiente › Bien › Componente. **Reemplazada por la SPEC 003:** el Local deja de existir; el inmueble es la ficha del centro. |
| Componente | Bien asociado a otro bien (colchón de una cama, silla de una mesa). |
| Permisos | Por acción además de por pantalla (§3). Provisionales, por validar. |
| Alcance | P1 (altas, ediciones, jerarquía y permisos) + P2 (mejoras). Sin persistencia. |

## 2. Hallazgos atendidos

| Pantalla | Acción incorporada | Prioridad |
| --- | --- | --- |
| Vehículos (nueva) | Lista por centro, registrar y actualizar vehículo; centros sin movilidad visibles. | P1 |
| Centros | Registrar centro con los datos de su inmueble; ficha editable por completo. | P1 |
| Ambientes | Registrar y actualizar ambiente. | P1 |
| Bienes y componentes | Árbol desde el centro; actualizar datos del bien; asociar o quitar componente; registrar componente. | P1 |
| Servicios | Registrar servicio no registrado; actualizar ficha del servicio. | P1 |
| Todas | Botones de acción visibles según `puedeHacer(accion)`. | P1 |
| Ambientes | Registrar intervención; marcar novedad como atendida; enlace al ambiente en Bienes. | P2 |
| Centros | Fotografías en memoria con vista previa. | P2 |
| Registro | Contexto desde la URL (`car`, `ambiente`, `asociar`). | P2 |
| Itinerarios y Combustible | Vehículo preseleccionado desde la URL (`vehiculo`). | P2 |
| Incidencias | Años del filtro calculados desde los hechos. | P2 |

## 3. Permisos por acción (⚠️ por validar)

| Acción | Central | CAR | Verificación | Chofer |
| --- | :-: | :-: | :-: | :-: |
| `centro.registrar` | ✓ | | | |
| `centro.actualizar`, `centro.foto` | ✓ | ✓ | | |
| `ambiente.registrar`, `ambiente.actualizar`, `ambiente.novedad`, `ambiente.intervencion`, `novedad.atender` | | ✓ | | |
| `bien.registrar`, `bien.actualizar`, `bien.componente`, `bien.baja`, `bien.reposicion` | | ✓ | | |
| `bien.verificar`, `bien.incidente` | | ✓ | ✓ | |
| `precio.informar` | ✓ | | | |
| `servicio.registrar`, `servicio.actualizar`, `servicio.periodo`, `servicio.hecho` | | ✓ | | |
| `vehiculo.registrar`, `vehiculo.actualizar` | | ✓ | | |
| `itinerario.registrar`, `itinerario.ejecucion`, `combustible.informar` | | ✓ | | ✓ |

## 4. Reglas nuevas

| Regla | Implementación |
| --- | --- |
| Un componente solo se asocia a un bien activo del mismo ambiente. **Los componentes tienen un solo nivel (SPEC 008):** el padre no puede ser a su vez componente y un bien con componentes no puede pasar a serlo. | `services/acciones.js › puedeAsociar`, `registrarBien` |
| Cambiar la condición de un bien deja un antecedente «Condición actualizada»; cambiar su asociación, «Componente actualizado». | `actualizarBien`, `asociarBien`, `desasociarBien` |
| La placa de un vehículo y el código de un centro son únicos. | `VehiculoDialog`, `CentroDialog` |
| Un pintado actualiza el último pintado del ambiente solo si es más reciente. | `registrarIntervencion` |
| Una novedad atendida deja de generar necesidad de infraestructura. | `atenderNovedad` + `calcularNecesidades` |
| Las fotografías viven en memoria; no deben mostrar NNA ni personas. | `FotoDialog` |

## 5. Propuestas no implementadas (validar con el jefe de proyecto)

- Trasladar un bien entre ambientes: ¿se trasladan sus componentes?
- ~~CAR con varios locales~~: descartado por la SPEC 003 (el Local queda fuera).
- Chofer como entidad propia, con asignaciones a vehículos.
- Persistencia y backend; priorización presupuestal; novedades del centro fuera de los ambientes.

## 6. Tareas

1. Permisos por acción (`perfiles.js`, `usePerfil.js`). ✅
2. Jerarquía: `arbolDeCentros`, `textoUbicacion`, menú y rutas. ✅
3. Acciones y diálogos P1. ✅
4. Mejoras P2. ✅
5. Verificación en navegador. Ver README.
