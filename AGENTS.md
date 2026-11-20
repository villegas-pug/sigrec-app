# AGENTS.md

Este archivo orienta a los agentes de código (Codex, OpenCode, Claude Code) que trabajan en este repositorio.

## Overview

SIGREC (Sistema Integrado de Gestión de Recursos de Centros) es un **prototipo SPA sin backend** para la USPNNA – INABIF. Todo funciona con datos ficticios en memoria; no hay API, persistencia ni autenticación real. Interfaz, comentarios, nombres de dominio e identificadores están en español.

Stack: Vue 3.5 + Quasar 2.35 (`@quasar/app-vite` 2.4.1, Vite 7), Vue Router 5 en modo `hash`. Node `^22.12` (no actualizar `@quasar/app-vite` a 2.5+ sin Node 22.22). JavaScript (sin TypeScript); alias de import `src/`, `pages/`, `layouts/`, `components/` provistos por Quasar.

## Commands

```bash
npm install      # ejecuta `quasar prepare` en postinstall (genera .quasar/)
npm run dev      # quasar dev → http://localhost:9000
npm run build    # quasar build → dist/spa
```

No hay linter, formatter ni suite de pruebas configurados. La validación habitual es estática (sintaxis JS/Vue, `git diff --check`) y revisión manual en una instancia ya en ejecución (ver `docs/manual-validation.md`).

## Spec-driven development

Los cambios relevantes se especifican antes en `docs/spec/NNN-*.md` (numeración correlativa, hoy hasta 026). **Donde dos specs difieran, prevalece la posterior.** El código cita las specs en comentarios (`SPEC 011, Ola 5`, `SPEC 020`…); conservar esa trazabilidad al modificar comportamiento. `docs/reuniones/` contiene actas con decisiones del jefe de proyecto.

## Architecture

### Datos y reglas de negocio
- `src/data/*.json`: datos ficticios. `src/services/datos.js` los carga en un único almacén `reactive` (`db`) con helpers de consulta (`carPorId`, `modulosDeCar`, `ambientesDeModulo`…). Los cambios se pierden al recargar.
- Jerarquía: **Centro › Módulo › Ambiente › Bien › Componente** (componente = bien asociado a otro). El inmueble es parte de la ficha del centro (`car.inmueble`); no existe nivel «Local». `ambiente.carId` se mantiene igual al de su módulo.
- Baja lógica: un registro anulado lleva `anulacion` y deja de contar (`vigente` / `vigentes`). No se borran registros.
- `src/services/acciones.js`: todas las mutaciones del almacén (registrar, actualizar, anular, reactivar). Sellan con `FECHA_CORTE` y el autor del perfil activo (`services/autor.js`). El resto de `src/services/` son reglas de negocio puras (situación, atención, necesidades, inventario, servicios, combustible, búsqueda…).
- `src/config/demo.js`: fecha de corte fija `2026-10-30`, año de revisión y umbrales provisionales. Los cálculos usan `FECHA_CORTE`, nunca el reloj del sistema.
- `src/config/catalogos.js`: catálogos (estados, tipos de evento, tipos de servicio, condiciones).

### Perfiles y permisos (solo en cliente)
- `src/config/perfiles.js`: cuatro perfiles de demo con `accesos` (nombres de ruta; el primero es la ruta inicial), `acciones` (`entidad.registrar|actualizar|anular|…`) y ámbito (`carIds` / `vehiculoIds`, `null` = sin restricción). Toda acción nueva debe añadirse a `ACCIONES_MANTENIMIENTO` o `TODAS_LAS_ACCIONES`.
- `src/composables/usePerfil.js`: estado de módulo compartido; el perfil se recuerda en `localStorage` (`sigrec.perfil`).
- **Invariante**: cada `key` de `src/config/menu.js` = nombre de ruta en `src/router/routes.js` = entrada en `accesos` de `perfiles.js`. Al añadir una pantalla, actualizar los tres.

### Navegación con contexto (SPEC 005, 011, 025)
- Las pantallas reciben contexto por query (`?ambiente=`, `?hecho=`, `?registrar=1`, `?periodo=`…). Las rutas antiguas (`locales`, `ambientes`, `bienes`, `tablero`, `precios`…) son redirecciones que conservan la query; no eliminarlas.
- `MainLayout` monta cada página con `:key="route.fullPath"`: cambiar la URL reinicia la página. Por eso el estado de filtros/selección no se guarda en la URL sino en `history.state` mediante `useEstadoNavegacion(clave, { campo: ref })`; los valores deben ser JSON serializable (se copian con `JSON.parse(JSON.stringify())` para quitar proxies).
- `src/router/retorno.js`: botón «Volver a ‹pantalla de origen›». Guarda el origen en `history.state` (`sigrecOrigen`); la navegación desde el menú o el logo no ofrece volver (`marcarNavegacionPrincipal`). `primeraVisita()` evita que un enlace profundo reabra su diálogo al volver o recargar.
- «Gestión de centros» (`GestionCentrosPage.vue`, `components/gestion/`) es una sola pantalla exploradora de toda la jerarquía con detalle y acciones por nivel.

### Otras piezas
- `src/services/voz/`: dictado por voz con motor del navegador o Whisper en Web Worker (`@huggingface/transformers`) (SPEC 007).
- Escaneo QR con cámara (`useEscaneo`, `jsqr` como respaldo); requiere HTTPS o `localhost`.
- Manual de usuario (SPEC 026): catálogo en `src/config/manual.js`, medios finales en `public/manual/v1/` (MP4 + WebVTT). Ruta `manual?chapter=<id>&t=<segundos>`. La producción (`scripts/manual-*.mjs|ps1`, guiones en `scripts/manual/scenarios/`) usa playwright-cli, ffmpeg y voz SAPI; los intermedios viven en `artifacts/manual-usuario/` (excluido de Git).
- `docs/modelo-er/`: visor independiente del modelo entidad-relación (no forma parte de la SPA).
