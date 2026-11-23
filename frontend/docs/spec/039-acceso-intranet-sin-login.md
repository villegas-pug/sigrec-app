# SPEC 039 — Acceso desde la intranet sin página de inicio de sesión

Sustituye la autenticación local de la SPEC 037 (login, cookie JWT, CSRF, sesión revocable, contraseñas BCrypt, perfiles `SGR_*` por ámbito). Donde difieran, prevalece esta SPEC.

## Contexto

SIGREC se abre redirigido desde la intranet del INABIF. La intranet identifica al usuario y el menú que SRH le asigna define las pantallas a las que accede. No existe pantalla de inicio de sesión. El flujo es **idéntico al de `educalle-app`** (`MainLayout.vue`): lo ejecuta el layout, sin guardas de router, con las claves en `localStorage` y las llamadas a SRH desde el navegador. Solo cambia el prefijo de las claves (`sgr-*` en lugar de `sgs-*`), la plataforma (Vue 3) y la guarda de rutas, que educalle no tiene.

## Valores de integración

| Dato | Valor |
| --- | --- |
| `idSistema` de SIGREC en SRH | `345` |
| Servicio SRH | `https://srvapp01.inabif.gob.pe:8443/SRH` |
| URL de la intranet (no autorizado y sesión terminada) | `https://srvapp01.inabif.gob.pe:8443/intranet/#/` |
| URL al pulsar «Salir» (como educalle) | `https://srvapp01.inabif.gob.pe:8443/seguridad/SPrincipal` |
| Vigencia del token local | 240 minutos |
| Origen CORS de desarrollo | `http://10.101.0.36:9000` |
| Origen CORS de producción | **pendiente** |

## Flujo (`layouts/MainLayout.vue` + `composables/useSesionIntranet.js`)

1. La intranet redirige a `…/#/<ruta>?p=<JWT>` (o `…/?p=<JWT>`). El JWT contiene `idUsuario`, `idSistema` y `exp`.
2. Al crearse el layout:
   - si existe `sgr-session-dialog-open`, se limpia la sesión;
   - si existen `sgr-idUsuario` y `sgr-session-token`, se inicia el chequeo y se consulta el menú;
   - si no, se limpia sin redirigir, se procesa `p` y se consulta el menú.
3. `recibirParametros`: lee `p` de la query de la ruta, del hash o de `window.location.search`; lo decodifica **sin verificar firma**; exige `idUsuario`, `idSistema` y `exp` vigente. Avisos: «No llegó el parámetro p», «Token inválido», «Token incompleto», «Token expirado».
4. Valida con `SPermiso?action=login&tipo=PERFIL_POR_USUARIO_Y_SISTEMA&u=<idUsuario>&s=<idSistema>`. Respuesta vacía: se limpian las claves, «NO ESTÁ AUTORIZADO A INGRESAR» y redirección a la intranet.
5. Guarda en `localStorage` (plugin Quasar): `sgr-idUsuario`, `sgr-idPerfil`, `sgr-nombreUsuario`, `sgr-nombreCompleto`, `sgr-nombreUnidad`, `sgr-idPersonal`, `sgr-numeroDocumento`, `sgr-token` (el JWT `p`), `sgr-payload` y `sgr-session-token` (JWT HS256 local de 240 minutos, firmado con crypto-js). Quita `p` de la URL.
6. Cada 5 segundos verifica `sgr-session-token`. Al vencer muestra «Sesión expirada: ¿Desea continuar trabajando?». «Sí» regenera el token desde `sgr-payload`; «No» limpia `sgr-*` y vuelve a la intranet.
7. El menú sale de `SPermiso?action=itemsMenu2&u=<sgr-idUsuario>&s=345` y se pinta como árbol módulo › menú › submenú (título de módulo oculto para `SIGREC`; opciones con `flgDeshabilitado = 1` apagadas; `INICIO` con `#` equivale a `inicio`). La navegación es `router.push('/' + enlace)`.
8. **Guarda de rutas (extensión respecto de educalle):** si la ruta actual no corresponde a un `enlace` habilitado del menú, el layout muestra «módulo no disponible» en lugar de la pantalla.
9. Cada llamada a `/api/v1/**` envía `X-Usuario-Id` (`sgr-idUsuario`) y `X-Usuario-Nombre` (`sgr-nombreCompleto`, codificado). Un 401 limpia la sesión y vuelve a la intranet.

### Forma de `itemsMenu2`

La firma de retorno es un arreglo de nodos con `descripcion`, `enlace`, `icono`, `orden`, `modFlgMenuAbiertoDefecto`, `flgDeshabilitado`, `separador` y `subitems`. Los nombres, iconos, orden y enlaces los define la base de datos de SRH; el código no supone valores concretos. El `icono` es un nombre de Material Icons y el `enlace` es la **ruta (path)** de SIGREC, p. ej. `necesidades/inventario`.

## Modelo de acceso (como educalle)

- El menú de SRH define las **pantallas**. Dentro de ellas el usuario puede ejecutar todas las acciones y ve todos los centros y vehículos (`puedeHacer` devuelve `true`).
- El backend no autoriza por defecto: `sigrec.security.autorizacion=false` (`SIGREC_AUTORIZACION`). `Acceso` conserva la identidad de auditoría (cabeceras `X-Usuario-*`; el `SGR_USUARIO` se crea en el primer ingreso con proveedor `INTRANET`).
- No hay equivalencia de perfiles `SRH → SGR_*`.

## Riesgos aceptados

- La identidad no se verifica (JWT sin firma comprobada) y el API no autoriza. Quien alcance el backend por red puede leer, registrar y anular en cualquier centro. El backend debe ser accesible solo desde la red de la intranet.
- El secreto del token local viaja en el bundle (igual que en educalle): no es un control de seguridad, solo controla la caducidad de la sesión en el navegador.
- Dentro de una pantalla no hay distinción entre CAR, VERIFICA y CHOFER.
- Verificar la firma de `p` queda como mejora; el único punto en el backend es `IdentidadIntranet`.

## Configuración

Frontend (al compilar, valores por defecto en `quasar.config.js` › `build.env`): `SIGREC_SRH_URL`, `SIGREC_SISTEMA_ID`, `SIGREC_INTRANET_URL`, `SIGREC_SALIR_URL`, `SIGREC_TOKEN_EXPIRATION_MINUTES`, `SIGREC_TOKEN_SECRET`. Backend: `SIGREC_AUTORIZACION` y `SIGREC_CORS_ORIGIN`.

## Pendientes

- Permiso CORS en SRH para el origen de desarrollo y el **origen de producción**.
- Carga del menú de SIGREC en SRH para el sistema 345 (enlaces como rutas, icono Material, orden).
- Las pruebas E2E de la SPEC 038 que inician sesión requieren un SRH de prueba o un stub.
