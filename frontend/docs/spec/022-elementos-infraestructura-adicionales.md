# SPEC 022 — Elementos de infraestructura adicionales en Centros y Módulos

- **Fecha:** 2026-11-11
- **Estado:** Especificado antes de implementar; validación visual y funcional pendiente de autorización.
- **Complementa:** SPEC 010 (estado por elemento), SPEC 011 Ola 2 (captura rápida) y SPEC 020 (Módulos).

## Contract

- Los 8 elementos base (`ELEMENTOS_INFRAESTRUCTURA`) se conservan. Centros y Módulos pueden dar de alta elementos adicionales en el mismo formulario donde se evalúan: «+ Agregar elemento» ofrece sugerencias comunes (cerco perimétrico, portón, cisterna, tanque elevado, etc.) y acepta texto libre.
- Un elemento agregado pertenece solo a ese Centro o Módulo: `elementosAdicionales: [{ key, label }]` (Centro en `inmueble.construccion`, Módulo en el propio registro). Su condición se guarda en `estadoElementos` con clave `extra-<slug>`. Se evalúa con el mismo B/R/M/I, cuenta en «N de M evaluados» y en los elementos críticos, y puede quitarse junto con su condición.
- No se admiten nombres duplicados (con un elemento base o agregado, sin distinguir tildes ni mayúsculas) ni de más de 40 caracteres.
- El Módulo registra y muestra el estado de su infraestructura igual que el Centro; los elementos críticos de módulos se suman a los indicadores de Inicio y a la consulta «Elementos críticos», con enlace al módulo.
- El Ambiente conserva la lista fija, sin elementos agregados.
- Fuera de alcance: catálogo global administrado de elementos e incidentes desde elementos del centro o del módulo.

## Acceptance

- Agregar desde sugerencias y con texto libre; rechazar duplicados y nombres largos; quitar un agregado; guardar y consultar en solo lectura.
- Conteos «N de M», «Marcar los no evaluados como Bueno» y aviso de críticos con elementos agregados.
- Inicio y consulta de elementos críticos con módulos y elementos agregados.
- Regresión: formularios y fichas del Ambiente sin cambios.
- Teclado, foco visible y 360 px sin desbordes.

## Validation

- Revisión estática: 8 SFC compilados con `@vue/compiler-sfc` sin errores; sintaxis de servicios, utilidades y catálogos con `node --check`; `cars.json`, `modulos.json` y `ambientes.json` válidos; `git diff --check` sin errores.
- Las funciones de `infraestructura.js` reciben `adicionales` opcional: las llamadas del Ambiente no lo pasan y conservan la lista base. `identificador` se trasladó a `utils/formato.js` y se reutiliza en `acciones.js`.
- Datos de muestra: Cisterna (regular) en el inmueble de AMA; Campana extractora (mala) en AMA-M02, que suma un elemento crítico en Inicio.
- No se ejecutaron pruebas, builds, servidores ni validación visual o funcional; quedan pendientes de autorización.
