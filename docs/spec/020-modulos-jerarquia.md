# SPEC 020 — Nivel Módulo en la jerarquía del centro

- **Fecha:** 2026-11-11
- **Estado:** Especificado antes de implementar; validación visual y funcional pendiente de autorización.
- **Complementa:** SPEC 005 L03. `ambiente.bloque` y `ambiente.ubicacion` se conservan como datos opcionales del ambiente dentro de su módulo.

## Contract

- Jerarquía: Centro › Módulo › Ambiente › Bien › Componente. Todo ambiente pertenece a un módulo de su mismo centro (`ambiente.moduloId` obligatorio). `ambiente.carId` se conserva denormalizado e invariante (`modulo.carId === ambiente.carId`) para no alterar a los consumidores que filtran por centro ni el ámbito de los perfiles.
- Módulo: pequeña casa o edificación del centro. Datos del alta:

| Campo | Clave | Obligatorio | Regla |
|---|---|---|---|
| Código | `id` | Automático | `{CAR}-M01…`; inmutable. |
| Nombre | `nombre` | Sí | Texto. |
| Tipo de módulo | `tipo` | Sí | `casa` (vive un grupo de residentes) o `comun` (uso común: comedor, cocina, lavandería, administración, talleres). Por defecto `casa`. |
| Capacidad de residentes | `capacidad` | No | Entero ≥ 0; solo para `casa`. |
| N.º de pisos | `pisos` | Sí | Entero ≥ 1; por defecto 1. |
| Área construida (m²) | `areaM2` | No | Número > 0. |
| Condición | `condicion` | Sí | Catálogo de condición de ambientes. |
| Referencia de ubicación | `ubicacion` | No | Texto. |

- Los módulos de uso común no se vinculan a casas: pertenecer al centro implica que todas sus casas los comparten. Se distinguen con «Uso común», icono propio y sección propia. Un futuro `atiendeA` opcional queda fuera de alcance.
- Árbol de Centros: centro › módulos (casas primero) › ambientes › bienes. Ficha del módulo con datos, ambientes y acciones Actualizar y Anular/Reactivar. La ficha del centro lista módulos agrupados en «Casas» y «Uso común» y registra módulos; el ambiente se registra desde su módulo.
- Anulación: un módulo con ambientes activos no se anula; un ambiente no se reactiva con su módulo anulado; un módulo no se reactiva con su centro anulado. Los módulos activos bloquean la anulación del centro.
- La edición del ambiente permite moverlo a otro módulo activo del mismo centro. Los ids de ambientes y bienes no cambian.
- Texto de ubicación: «Centro › Módulo › Ambiente». Los selectores Centro → Ambiente conservan sus contratos y muestran «Módulo › Ambiente».
- Enlace profundo `?modulo=`; se conservan `?car=`, `?ambiente=`, `?bien=` y `?registrar=1`. Búsqueda global incluye módulos.
- Permisos `modulo.registrar | actualizar | anular` para los mismos perfiles que `ambiente.*`.
- Fuera de alcance: incidencias con origen módulo, fotos por módulo, filtros por módulo y columnas «Módulo» separadas en exportaciones.

## Acceptance

- Árbol, ruta de ficha y búsqueda con los tres niveles; filtros de texto por nombre de módulo.
- Alta y edición de módulo con validaciones junto al campo; capacidad visible solo para casas; confirmación al descartar.
- Bloqueos de anulación y reactivación; movimiento de ambiente entre módulos del mismo centro.
- Regresión: inventario, mantenimientos, necesidades, incidencias, recorrido de verificación, Inicio y enlaces profundos existentes.
- Teclado, foco visible, móvil maximizado y sin desplazamiento horizontal.

## Validation

- Revisión estática: 14 SFC compilados con `@vue/compiler-sfc` sin errores; sintaxis de servicios y configuración revisada con `node --check`; `modulos.json`, `ambientes.json` y `servicios.json` válidos (12 ambientes con `moduloId`).
- La pestaña del centro conserva el nombre `ambientes` (enlaces de Inicio con `tab=ambientes`) y muestra «Módulos y ambientes»; el árbol abre por defecto centros y módulos para mantener visibles los ambientes.
- No se ejecutaron pruebas, builds, servidores ni validación visual o funcional; quedan pendientes de autorización.
