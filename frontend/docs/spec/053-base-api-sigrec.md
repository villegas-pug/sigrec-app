# SPEC 053 — Base de la API en el mismo origen (`/sigrec/api/v1`)

## Problema

La SPA se sirve en `/sigrec/` detrás del proxy de la intranet, pero el build llamaba a la API en otro origen (`http://172.19.0.51:4006`). Cada petición era cross-origin y dependía de CORS: el preflight devolvía `403 Invalid CORS request` y la SPA no cargaba datos. Además, las URLs de fotos que devuelve el backend (`/api/v1/fotos/{id}/contenido`) no resolvían desde `/sigrec/`.

## Decisión

- La SPA llama a la API en `/sigrec/api/v1`, mismo origen. El backend no cambia: sus controladores siguen en `/api/v1/**`.
- `services/api.js` construye la base `RAIZ = (SIGREC_API_URL ?? '') + '/sigrec'` y las peticiones van a `${RAIZ}/api/v1${path}`.
- `SIGREC_API_URL` queda vacío por defecto (dev y build). Solo se rellena para desplegar la API en otro origen; en ese caso CORS vuelve a ser necesario.
- Las URLs absolutas que devuelve el backend (fotos) se resuelven con `urlApi(ruta)` (`services/api.js`) al mostrarlas o descargarlas.
- Desarrollo: el servidor de Quasar atiende `/sigrec/api` y reenvía al backend quitando `/sigrec` (`quasar.config.js`, `devServer.proxy`).

## Requisito del proxy de la intranet

El proxy que publica SIGREC debe enrutar `/sigrec/api/` al servicio del backend (`ms-sigrec`, puerto 8080 en red interna) **quitando el prefijo `/sigrec`**, de modo que el backend reciba `/api/v1/...`. La configuración del proxy no está en este repositorio. Sin esa regla, `/sigrec/api/v1` responde 404 o 502.

## Riesgos aceptados

- Quien compile con un origen de API explícito debe pasar `SIGREC_API_URL` en el entorno; el build ya no tiene un valor fijo.
- CORS del backend (`sigrec.security.cors-origin`) deja de ser necesario con el despliegue por mismo origen, pero se conserva para el caso de otro origen.

## Criterios de aceptación

1. Todas las peticiones de la SPA van a `/sigrec/api/v1/...` y no a otro origen.
2. Las fotos se muestran y descargan desde `/sigrec/api/v1/fotos/{id}/contenido`.
3. El build no contiene `172.19.0.51:4006`.

## Validación

- Revisión estática (`node --check`, compilación de los SFC tocados) y `git diff --check`.
- No ejecutar builds, servidores ni pruebas sin autorización explícita.
