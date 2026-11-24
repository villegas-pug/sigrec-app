# AGENTS.md

Este archivo orienta a los agentes de código (Codex, OpenCode, Claude Code) que trabajan en este repositorio.

## Overview

SIGREC (Sistema Integrado de Gestión de Recursos de Centros) es la SPA de la USPNNA – INABIF con backend Spring Boot (`backend/`, SPEC 037). **No tiene página de inicio de sesión** (SPEC 039): se abre redirigido desde la intranet con un JWT en `?p=`, y el perfil define los menús y submenús. Parte de los datos del modelo aún son ficticios en memoria. Interfaz, comentarios, nombres de dominio e identificadores están en español.

Stack: Vue 3.5 + Quasar 2.35 (`@quasar/app-vite` 2.4.1, Vite 7), Vue Router 5 en modo `hash`. Node `^22.12` (no actualizar `@quasar/app-vite` a 2.5+ sin Node 22.22). JavaScript (sin TypeScript); alias de import `src/`, `pages/`, `layouts/`, `components/` provistos por Quasar.

La raíz Git contiene `frontend/`, `backend/` y `database/`. Las excepciones en la raíz son los metadatos de `.git/` y los archivos `AGENTS.md`, `README.md` y `.gitignore`. La SPA y sus dependencias locales viven en `frontend/` y `frontend/node_modules/`. La documentación y los artefactos viven en `frontend/docs/` y `frontend/artifacts/`. Las rutas abreviadas a archivos de la SPA son relativas a esa carpeta. El visor ER está en `database/modelo-er/` y `backend/` reserva el espacio para la futura API.
## Commands

```bash
cd frontend
npm install      # ejecuta `quasar prepare` en postinstall (genera .quasar/)
npm run dev      # quasar dev → http://10.101.0.36:9000/sigrec/
npm run build    # quasar build → dist/spa
```

No hay linter, formatter ni suite de pruebas configurados. La validación habitual es estática (sintaxis JS/Vue, `git diff --check`) y revisión manual en una instancia ya en ejecución (ver `frontend/docs/manual-validation.md`).

## Spec-driven development

Los cambios relevantes se especifican antes en `frontend/docs/spec/NNN-*.md` (numeración correlativa, hoy hasta 053). **Donde dos specs difieran, prevalece la posterior.** La [SPEC 035](frontend/docs/spec/035-reorganizacion-carpetas-sigrec.md) documenta la migración inicial. La [SPEC 036](frontend/docs/spec/036-estructura-raiz-frontend-backend-database.md) define la estructura vigente. El código cita las specs en comentarios (`SPEC 011, Ola 5`, `SPEC 020`…); conservar esa trazabilidad al modificar comportamiento. `frontend/docs/reuniones/` contiene actas con decisiones del jefe de proyecto.

## Architecture

### Datos y reglas de negocio
- `src/services/datos.js`: almacén `reactive` (`db`) con helpers de consulta (`carPorId`, `modulosDeCar`, `ambientesDeModulo`…). Empieza vacío y se hidrata **solo por REST** (SPEC 037, 041); `frontend/src/data/*.json` ya no se lee (solo es referencia del modelo ER y del manual).
- Jerarquía: **Centro › Módulo › Ambiente › Bien › Componente** (componente = bien asociado a otro). El inmueble es parte de la ficha del centro (`car.inmueble`); no existe nivel «Local». `ambiente.carId` se mantiene igual al de su módulo.
- Baja lógica: un registro anulado lleva `anulacion` y deja de contar (`vigente` / `vigentes`). No se borran registros.
- `src/services/acciones.js`: todas las mutaciones, siempre por la API REST (registrar, actualizar, anular, reactivar). El backend sella con la fecha real y con el usuario de la intranet (cabeceras `X-Usuario-*`). El resto de `src/services/` son reglas de negocio puras (situación, atención, necesidades, inventario, servicios, combustible, búsqueda…).
- `src/config/reglas.js`: `hoy()` (fecha real, `America/Lima`), año de revisión (año actual + 1) y umbrales provisionales (SPEC 040). Los cálculos usan `hoy()`; el backend usa `shared/model/Hoy`. Nunca `toISOString()` para obtener «hoy».
- `src/config/catalogos.js`: catálogos (estados, tipos de evento, tipos de servicio, condiciones).

### Acceso desde la intranet y menú (SPEC 039, 041)
- Sin login ni sesión propia, **igual que `educalle-app`**: `layouts/MainLayout.vue` ejecuta el ingreso con `composables/useSesionIntranet.js` (sin guardas de router). Lee `?p=` (JWT, **sin verificar firma**), valida con `SRH/SPermiso?action=login…`, guarda en `localStorage` las claves `sgr-*` (`sgr-idUsuario`, `sgr-nombreCompleto`, `sgr-token`, `sgr-payload`, `sgr-session-token`…) y consulta `SPermiso?action=itemsMenu2&u=…&s=345`. El token local HS256 (crypto-js, 240 min) se revisa cada 5 s con diálogo «¿Desea continuar trabajando?». Sin identidad: aviso «Ingrese desde la intranet».
- El **menú** lo define SRH (módulo › menú › submenú, `icono` Material, `flgDeshabilitado`). El `enlace` de SRH es la **ruta (path)**, p. ej. `necesidades/inventario`; `puedeAcceder(nombreDeRuta)` resuelve path → nombre con `router/routes.js`. Una ruta fuera del menú muestra `SinAcceso`. `puedeHacer` devuelve siempre `true` (sin acciones ni ámbito, como educalle).
- `services/api.js` envía `X-Usuario-Id` y `X-Usuario-Nombre`; un 401 limpia la sesión y vuelve a la intranet. La API va en el mismo origen, en `/sigrec/api/v1` (SPEC 053): el proxy quita `/sigrec` y entrega `/api/v1` al backend.
- **Carga por pantalla (SPEC 041, 052)**: el layout solo pide `/catalogos`. Cada ruta declara `meta.datos` (grupos de `services/cargaDatos.js`) y el layout los carga **antes** de montar la pantalla. Solo `catalogos` y `tiposBien[:precios]` quedan en caché por sesión; los demás grupos se piden cada vez.
- **Filtros de cabecera (SPEC 052)**: las rutas con `meta.filtros: { principal, registro? }` muestran `components/layout/FiltrosCabecera.vue` (Tipo de Entidad y Entidad fijos, Centro con buscador `GET /centros/buscar`, Año y Mes). El estado es global (`composables/useFiltrosCabecera.js`) y no va en la URL; `?car=` fija el centro. El layout envía `?centro=` a todos los grupos y `anio`/`mes` (sobre `FEC_REGISTRA`, `shared/model/FiltroConsulta`) solo al principal (a todos con `registro: 'CENTRO'`, vía `FiltroCentros`); al cambiar un filtro recarga sin desmontar la pantalla. Las pantallas leen el centro con `useCentroCabecera` (no hay selectores de centro locales). Inicio no usa grupos: pide `GET /api/v1/inicio/resumen` (SPEC 044), con indicadores, situación por centro y avisos **calculados en el backend** (`inicio/calculo/`); la SPA solo suma totales y redacta los avisos (`services/resumenInicio.js`, `avisosResumen.js`). `/inicio/datos` ya no existe. Al añadir una pantalla: ruta con `meta.datos` (y `meta.filtros` salvo Inicio y Manual), entrada en `menu.js` y menú en SRH.
- **Riesgo aceptado**: el backend no autoriza (`sigrec.security.autorizacion=false`) y confía en el `X-Usuario-Id` recibido; debe ser accesible solo desde la red de la intranet.
- Catálogos (SPEC 040): `GET /api/v1/catalogos` rellena `config/catalogos.js` (códigos, nombres, orden); tono e iconos siguen en el cliente.

### Navegación con contexto (SPEC 005, 011, 025)
- Las pantallas reciben contexto por query (`?ambiente=`, `?hecho=`, `?registrar=1`, `?periodo=`…). Las rutas antiguas (`locales`, `ambientes`, `bienes`, `tablero`, `precios`…) son redirecciones que conservan la query; no eliminarlas.
- `MainLayout` monta cada página con `:key="route.fullPath"`: cambiar la URL reinicia la página. Por eso el estado de filtros/selección no se guarda en la URL sino en `history.state` mediante `useEstadoNavegacion(clave, { campo: ref })`; los valores deben ser JSON serializable (se copian con `JSON.parse(JSON.stringify())` para quitar proxies).
- `src/router/retorno.js`: botón «Volver a ‹pantalla de origen›». Guarda el origen en `history.state` (`sigrecOrigen`); la navegación desde el menú o el logo no ofrece volver (`marcarNavegacionPrincipal`). `primeraVisita()` evita que un enlace profundo reabra su diálogo al volver o recargar.
- «Gestión de centros» (`GestionCentrosPage.vue`, `components/gestion/`) es una sola pantalla exploradora de toda la jerarquía con detalle y acciones por nivel.

### Otras piezas
- `src/services/voz/`: dictado por voz con motor del navegador o Whisper en Web Worker (`@huggingface/transformers`) (SPEC 007).
- Escaneo QR con cámara (`useEscaneo`, `jsqr` como respaldo); requiere HTTPS o `localhost`.
- Manual de usuario (SPEC 026): catálogo en `src/config/manual.js`, medios finales en `public/manual/v1/` (MP4 + WebVTT). Ruta `manual?chapter=<id>&t=<segundos>`. La producción (`scripts/manual-*.mjs|ps1`, guiones en `scripts/manual/scenarios/`) usa playwright-cli, ffmpeg y voz SAPI. Los intermedios viven en `frontend/artifacts/manual-usuario/` y se excluyen del índice.
- El [visor del modelo entidad-relación](database/modelo-er/README.md) es independiente de la SPA. Desde la raíz Git se inicia con `npm --prefix database/modelo-er start`.
