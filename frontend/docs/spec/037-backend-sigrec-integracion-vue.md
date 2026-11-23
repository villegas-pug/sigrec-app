# SPEC 037 — Backend SIGREC e integración con Vue

## Etapa 1

Java 21, Spring Boot 3.2.5, Spring MVC, Spring Data JPA, Oracle JDBC 21.9.0.0, validación Jakarta y Maven. Punche usa Oracle y organiza sus capas por funcionalidad. Su gateway contiene validación JWT de referencia, con el filtro comentado. SIGREC implementa autenticación y autorización activas en el propio monolito. Spring Boot 3.2 terminó su soporte abierto. Revisar la versión antes del despliegue institucional.

La etapa 1 comprende seguridad, catálogos y la jerarquía centro › módulo › ambiente, incluidos los elementos evaluados editados en sus fichas. Fotos, intervenciones y novedades, así como las demás operaciones del prototipo, conservan su almacenamiento ficticio durante esta etapa.

## Contrato

- `GET /api/v1/auth/csrf`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`. Cookie JWT HttpOnly. CSRF obligatorio en escrituras. Sesión revocable por identificador hasheado. Contraseñas BCrypt.
- `/api/v1/usuarios` permite consultar, registrar, actualizar, desactivar y asignar perfiles y ámbitos. Solo el perfil CENTRAL en ámbito GLOBAL recibe estos permisos nuevos, derivados del alcance de administración aprobado.
- `GET /api/v1/catalogos` devuelve los valores vigentes de los dominios del ERD. `GET /api/v1/centros/jerarquia` consulta el árbol filtrado por ámbito. `/api/v1/centros`, `/api/v1/modulos` y `/api/v1/ambientes` registran, actualizan, anulan y reactivan mediante el permiso de acción correspondiente. Los listados de jerarquía incluyen anulados para preservar los filtros del prototipo.
- Las autorizaciones de negocio provienen de `frontend/src/config/perfiles.js`, `menu.js` y `routes.js`. Accesos son permisos RUTA y acciones son permisos ACCION. Perfil y rol son la misma entidad. CENTRAL es global, CAR y VERIFICA se asignan a AMA y CHOFER a AMA-V01. El alcance de vehículo conserva el contexto de su centro para la vista de movilidad, sin habilitar la consulta de Gestión de centros.
- La corrección de combustible y las demás operaciones ficticias conservan sus reglas de demostración en el navegador. Al migrarlas se autorizarán en servidor con el recurso persistido y la autoría autenticada.

## Configuración y verificación

Usar `PROFILE=dev` por defecto y `SIGREC_DB_URL`, `SIGREC_DB_USERNAME`, `SIGREC_DB_PASSWORD`, `SIGREC_DB_SCHEMA` y `SIGREC_JWT_SECRET` por entorno. El arranque habitual valida el esquema. La generación inicial se habilita con `SIGREC_DDL_AUTO=update` tras inspeccionar el esquema compartido en solo lectura. Las semillas idempotentes se habilitan con `SIGREC_SEED=always`; la carga de ejemplos por JPA se habilita con `SIGREC_IMPORTAR_DEMO=true`. Las credenciales locales de prueba se configuran en un entorno de desarrollo dedicado.

## Convención de paquetes

El paquete base es `pe.gob.inabif.sigrec`. Cada feature usa las capas de `acta` y `aliado` de Punche:

| Capa | Responsabilidad |
| --- | --- |
| `controller` | Recibe y valida solicitudes, delega al servicio y devuelve `code`, `message` y `data`. |
| `dtos` | Mantiene el contrato de entrada y salida. Las escrituras declaran Bean Validation. |
| `mappers` | Usa MapStruct 1.5.5.Final con componentes Spring. Distingue creación, actualización, salida y mapeo a la entidad. |
| `model` | Define entidades JPA y datos de dominio de la feature. |
| `repository` | Separa la interfaz del adaptador y de Spring Data JPA. |
| `service` | Separa el contrato de la implementación transaccional. Usa repositorios de dominio y mappers. |

Features de la etapa 1: `auth`, `usuario`, `perfil`, `permiso`, `catalogo`, `centro`, `modulo`, `ambiente` y `elemento`. Los catálogos, perfiles y permisos se cargan por semillas y se consultan por REST. Los elementos evaluados son parte de las fichas de centro, módulo y ambiente y usan sus controladores. Las features de consulta tienen DTO y mapper de respuesta, y las de escritura tienen además sus contratos y mappers de creación y actualización. La configuración, la autorización transversal, los errores y el envoltorio REST se ubican en `config`, `security` y `shared`.

### Acceso a elementos evaluados

La ausencia de `ElementoController` es intencional. Vue obtiene los elementos en `GET /api/v1/centros/jerarquia`. Las escrituras llegan con la ficha del centro, módulo o ambiente y se procesan en la misma transacción con `ElementoService`. Así el ámbito se valida sobre el propietario y el formulario se guarda completo.

## Cuentas de prueba

| Usuario | Perfil | Ámbito | Variable local de contraseña |
| --- | --- | --- | --- |
| demo.central | Equipo central USPNNA | Global | `SIGREC_DEMO_CENTRAL_PASSWORD` |
| demo.car | Personal del CAR | Centro AMA | `SIGREC_DEMO_CAR_PASSWORD` |
| demo.verifica | Verificación física | Centro AMA | `SIGREC_DEMO_VERIFICA_PASSWORD` |
| demo.chofer | Chofer | Vehículo AMA-V01 · Centro AMA | `SIGREC_DEMO_CHOFER_PASSWORD` |

Las cuatro contraseñas son exclusivas de las cuentas de demostración del esquema de pruebas. No se reutilizan entre cuentas ni en otros entornos. El 21/11/2026 se comprobó en solo lectura que cada contraseña coincide con el hash BCrypt persistido y que las asignaciones corresponden a la matriz de la SPA. La copia operativa local está en `backend/.env.local`, excluido del índice. Las semillas reciben solo los hashes por las variables `SIGREC_DEMO_CENTRAL_HASH`, `SIGREC_DEMO_CAR_HASH`, `SIGREC_DEMO_VERIFICA_HASH` y `SIGREC_DEMO_CHOFER_HASH`.

## Resultado de la verificación de la etapa 1

| Comprobación | Resultado |
| --- | --- |
| Maven `compile`, `test` y `package` | JAR compilado y empaquetado. Cinco pruebas JUnit/MockMvc con Spring Security real y repositorios simulados, sin fallos. |
| `npm run build` y `npm run dev` | Build SPA y proxy local verificados. |
| Oracle 19c, esquema `USRSEGURIDAD` | Prevalidación de 76 nombres con `USER_OBJECTS`, `USER_TABLES` y `USER_CONSTRAINTS`. Cero colisiones antes de generar. Hibernate creó 11 tablas con `update` y se volvió a `validate`. |
| Semillas e importación | Dos arranques con semillas en `validate` conservaron objetos y cantidades. Se cargaron 60 valores de catálogo, cuatro perfiles, 75 permisos, 148 asociaciones de permisos y cuatro cuentas de demo. |
| REST contra Oracle | Login con las cuatro cuentas, límites por perfil y ámbito, gestión de usuarios, cambio de contraseña y revocación. Altas, ediciones, traslado, anulación y reactivación de la jerarquía. Se rechazaron un traslado entre centros y la anulación de un módulo con ambiente vigente. |
| Playwright CLI | Las cuatro cuentas conservaron su menú y las acciones esperadas. Con el perfil central se comprobó un enlace directo, alta de centro, recarga de la sesión, anulación y «Mostrar inactivos». Con Chofer se comprobó el rechazo de un enlace directo a Gestión de centros. |
| Persistencia después de reiniciar | Los dos centros creados antes del reinicio siguen anulados. En el arranque habitual sin semillas, dos altas concurrentes del mismo centro devolvieron 201 y 409. Una escritura de módulo con evaluación inválida devolvió 400 y se revirtió. El centro de concurrencia quedó anulado y la cuenta adicional quedó desactivada. |
| Visor ERD y Git | El validador del ERD 7.4.0 revisó 29 tablas sin errores. `git diff --check` pasó. |

Tablas de la etapa 1: `SGR_USUARIO`, `SGR_PERFIL`, `SGR_PERMISO`, `SGR_PERFIL_PERMISO`, `SGR_USUARIO_PERFIL`, `SGR_SESION`, `SGR_CATALOGO`, `SGR_CENTRO`, `SGR_MODULO`, `SGR_AMBIENTE` y `SGR_ELEMENTO`. Oracle creó los índices, restricciones y secuencias de identidad correspondientes.

Cambios visibles: pantalla de inicio de sesión, cierre de sesión, selector limitado a las asignaciones de la cuenta y nueva leyenda de versión. La auditoría del alta inicial muestra el actor técnico de importación y su fecha. Los módulos pendientes conservan sus pantallas y datos ficticios. Sus referencias respetan el contexto devuelto por la API para evitar que vistas como Inicio intenten resolver un ambiente fuera del ámbito de la cuenta.
## Etapa 2 — Inventario e incidencias

- Persistir los bienes, inventario previo e historial estructurado de la SPEC 034. La ficha y las acciones incluyen alta, edición de condición, asociación, desasociación, traslado, verificación, anulación y reactivación. El alta puede consumir un antecedente de inventario previo y registrar una verificación en la misma transacción.
- Implementar hechos y novedades de origen fijo, atención de infraestructura, evaluación por bien implicado, baja patrimonial, revisión individual de componentes, reposición y reversión. La situación del bien, la última verificación, la revisión pendiente y las necesidades se derivan de hechos vigentes.
- Exponer la lectura consolidada para las vistas existentes y comandos REST bajo `/api/v1/bienes` e `/api/v1/incidencias`. Los servicios resuelven permisos y el centro real del recurso. Las operaciones sobre un mismo centro se serializan mediante el bloqueo existente. La SPA conserva los cálculos de necesidades y sus formatos, con datos de inventario e incidencias de Oracle.
- Usar los ocho objetos de inventario e incidencias del ERD. Los hechos mantienen códigos públicos para los enlaces y metadatos mínimos para el orden y la presentación de antecedentes de demostración. Las semillas de esta etapa importan los ejemplos por JPA en una transacción idempotente.
- Previsualizar el DDL con `SIGREC_DDL_AUTO=none`, `--sigrec.ddl.etapa2=true` y las propiedades JPA `spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create` y `spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=<archivo-nuevo>`. Consultar `USER_OBJECTS`, `USER_TABLES` y `USER_CONSTRAINTS` en solo lectura para comprobar los nombres previstos. Con cero colisiones, usar `SIGREC_DDL_AUTO=update` y `--sigrec.ddl.etapa2=true` para limitar Hibernate a las ocho tablas de la etapa. Volver a `validate` para importar y probar.
- Los paquetes nuevos `pe.gob.inabif.sigrec.bien` y `pe.gob.inabif.sigrec.incidencia` conservan las seis capas de Punche. El paquete `catalogo` reutiliza `SGR_CATALOGO` para los tipos de bien y su autorización vigente. El ERD 7.5.0 documenta las columnas de compatibilidad histórica.

### Resultados de la etapa 2

- `mvn -f backend/pom.xml compile`, `test` y `package` finalizaron correctamente. JUnit y MockMvc aprobaron 7 pruebas con la cadena real de Spring Security. `npm --prefix frontend run build` generó `frontend/dist/spa`. Se detuvieron ambos servidores locales al finalizar el recorrido.
- La prevalidación revisó 150 nombres previstos en Oracle 19c, esquema `USRSEGURIDAD`, y halló cero colisiones. Hibernate creó `SGR_BIEN`, `SGR_INVENTARIO_PREVIO`, `SGR_HISTORIAL_BIEN`, `SGR_INCIDENTE`, `SGR_ATENCION`, `SGR_BAJA`, `SGR_REPOSICION` y `SGR_BIEN_IMPLICADO`, con 55 índices, 193 restricciones y 8 columnas de identidad. Se verificaron los identificadores y las fechas de DDL de las tablas preexistentes.
- Dos arranques con `validate` e importación habilitada conservaron los mismos conteos de demostración. Se cargaron 46 bienes, 5 antecedentes de inventario, 24 eventos de historial, 7 incidencias o novedades, 2 bajas y 1 reposición, con 8 relaciones de bienes implicados.
- La prueba REST sobre Oracle cubrió alcance por centro, permisos de los cuatro perfiles, altas, condición, componentes, traslado conjunto, verificación en lote, incidencias y sus evaluaciones, novedades, atención, bajas, reposiciones y reversión. Los registros creados para la prueba quedaron anulados.
- Playwright comparó 10 vistas con los datos ficticios de referencia y con Oracle, usando las cuatro cuentas. Coincidieron los menús, los textos y los resultados mostrados en las vistas comparadas. Con el perfil CAR se registró un incidente desde Vue, se comprobó el HTTP 201, se recargó el visor y se consultó el registro persistido. Se anuló el incidente de prueba al finalizar.
- El guardado REST deshabilita temporalmente el envío y conserva el formulario si la API devuelve un error.

## Etapa 3 — Planificación anual y precios referenciales

El módulo de planificación del ERD 7.5.0 tiene una única tabla propia, `SGR_PRECIO`. La etapa persiste importe en soles, mes opcional, procedencia y reemplazos. La cotización más reciente en el registro queda vigente aunque se haya informado con un mes anterior. Cambiar solo el mes o la fuente también agrega historial. Repetir los mismos datos conserva el registro. La escritura serializa por tipo de bien y utiliza la fecha de corte `2026-10-30` para el sello de reemplazo visible.

Las reglas PLA-02 a PLA-04 siguen en `necesidades.js` e `inventario.js`, con todas sus entradas leídas por REST. Se conservan los años 2026 a 2028, el año inicial 2027, el ámbito por centro, los importes nulos sin precio, las necesidades por incidente y vida útil, infraestructura y antecedentes de reposición. Filtros, CSV y simulación usan el mismo cálculo en el navegador y el monto simulado solo existe en la sesión de la vista. La consulta anual, los totales y la simulación no requieren tablas ni un cálculo duplicado.

| Pantalla o flujo | Endpoint | Permiso y ámbito | Tablas de origen |
| --- | --- | --- | --- |
| Necesidades, planificación anual, simulador, CSV e indicadores de Inicio | `GET /api/v1/centros/jerarquia`, `GET /api/v1/bienes/datos`, `GET /api/v1/catalogos/tipos-bien`, `GET /api/v1/precios` | Rutas `necesidades` e `inicio`; las consultas de centros y bienes filtran por las asignaciones y el precio vigente es referencia global. | `SGR_CENTRO`, `SGR_MODULO`, `SGR_AMBIENTE`, `SGR_BIEN`, `SGR_BAJA`, `SGR_REPOSICION`, `SGR_INCIDENTE`, `SGR_BIEN_IMPLICADO`, `SGR_ATENCION`, `SGR_CATALOGO`, `SGR_PRECIO` |
| Inventario para planificación, detalle, agrupaciones, componentes y CSV | Las mismas lecturas | Ruta `inventario`; datos patrimoniales limitados al ámbito de centro. | Tablas anteriores, más `SGR_INVENTARIO_PREVIO` y `SGR_HISTORIAL_BIEN` en la lectura consolidada |
| Precio de referencia en ficha de bien y contexto de incidencias | `GET /api/v1/precios` y `GET /api/v1/bienes/datos` | Rutas `centros` o `incidencias` con ámbito de centro o global; la API de inventario aplica ese límite al bien consultado. | `SGR_PRECIO`, `SGR_CATALOGO`, `SGR_BIEN` y tablas de incidencias |
| Catálogo contextual, precios anteriores e informar precio | `GET /api/v1/precios`, `PUT /api/v1/precios/{tipo}` | Ruta contextual `precios` global para incluir el historial. La escritura exige también `precio.informar` en esa asignación. Mantenimiento de tipos conserva las acciones `tipoBien.*`. Chofer no puede consultar precios. | `SGR_PRECIO`, `SGR_CATALOGO`, `SGR_USUARIO` |

Las rutas provienen de `menu.js`, `routes.js` y `perfiles.js`. Se conservan el alias contextual de precios y los permisos ya sembrados. La SPA carga por REST los importes durante la sesión y actualiza la ficha del tipo tras guardar para recalcular las vistas. Se conserva la carga inicial por JPA en desarrollo, usando `tipos-bien.json`; se omiten los tipos que ya tienen precios registrados. Solo se habilita DDL para `SGR_PRECIO`, después de comprobar en solo lectura la disponibilidad de sus nombres. El arranque habitual y la importación usan `validate`.

El comando de generación usa `--sigrec.ddl.etapa3=true` con el mismo procedimiento de previsualización en archivo y consulta de Oracle de la etapa 2. Esa opción limita el DDL a `SGR_PRECIO`. El ERD 7.5.0 conserva el contrato lógico; la unicidad condicional se materializa con una columna virtual de Oracle.

La cadena de Spring Security conserva la validación de JWT y de sesiones. El filtro que lee el JWT de la cookie se registra de forma explícita para exigir CSRF en las escrituras autenticadas. El controlador de autenticación rota la cookie CSRF al iniciar o cerrar sesión. Durante la sesión, las lecturas y escrituras autenticadas conservan la cookie.

### Resultados de la etapa 3

- Se incorporó `pe.gob.inabif.sigrec.precio` con las seis capas de Punche. `preciosRest.js` hidrata las valoraciones en Vue y aplica la respuesta del servidor al guardar.
- Oracle 19c, esquema `USRSEGURIDAD`, registró cero colisiones en la prevalidación de 19 nombres. Hibernate creó solo `SGR_PRECIO`, con siete índices, 21 restricciones y una columna de identidad. Las 19 tablas preexistentes conservaron su identificador y fecha de DDL. Dos arranques con `validate` e importación habilitada dejaron los mismos 11 precios vigentes.
- Pasaron `mvn -f backend/pom.xml compile`, `test` y `package`, con 10 pruebas JUnit/MockMvc, y `npm --prefix frontend run build`. El validador del ERD aceptó las 29 tablas del contrato 7.5.0.
- Playwright comparó 16 vistas de los cuatro perfiles. Coincidieron sus textos, diálogos, opciones autorizadas y resultados, incluida la simulación con un techo de S/ 1 200. La comparación del menú tuvo en cuenta la transición de plegado. Al guardar un precio, el envío queda deshabilitado hasta recibir la respuesta y el formulario conserva los datos si la API devuelve un error.
- Con un bien temporal de dos unidades se comprobó la transición de «Sin valorar» a S/ 34,50, la exportación CSV, un segundo precio con mes anterior, el historial con fecha de corte y el mismo `PUT` sin duplicados. El historial siguió limitado al perfil global con permiso de catálogo. Se verificaron también el rechazo de una escritura sin CSRF y la revocación de sesiones.
- Las pruebas REST contra Oracle de las etapas 1 y 2 pasaron con la cadena de seguridad corregida. Cubrieron usuarios, asignaciones, jerarquía, inventario, verificación, traslados, incidencias y atención, bajas, reposiciones y reversión. Se cerraron los casos de prueba mediante anulación o desactivación y se detuvieron los servidores locales.

## Etapa 4 — Servicios, períodos, pagos y continuidad

Persistir la ficha y continuidad de cada servicio del centro. Cada período informado se guarda como fila por servicio, año, ordinal y duración histórica. El pago documenta fecha, importe y sustento, y conserva los hechos automáticos de pago o retroceso del estado en la misma transacción. Los hechos de suministro se vinculan al servicio. Las correcciones en la línea de tiempo conservan el estado del período. La SPA conserva la grilla, sus avisos y la fecha de corte del 30/10/2026.

| Pantalla o flujo | Endpoint | Permiso y ámbito | Tablas |
| --- | --- | --- | --- |
| Servicios básicos y pagos, ficha y avisos de Inicio | `GET /api/v1/servicios` | Ruta `servicios`, asignación global o de centro | `SGR_SERVICIO`, `SGR_PERIODO`, `SGR_HECHO`, `SGR_CENTRO`, `SGR_CATALOGO` |
| Alta, edición y anulación o reactivación de ficha | `POST /api/v1/servicios`, `PUT /api/v1/servicios/{servicio}`, `POST /api/v1/servicios/{servicio}/{anular|reactivar}` | `servicio.registrar`, `servicio.actualizar`, `servicio.anular` y centro de la ficha | `SGR_SERVICIO`, `SGR_PERIODO` |
| Pago, pendiente y corrección de un período | `PUT /api/v1/servicios/{servicio}/periodos/{anio}/{numero}` | `servicio.periodo` y centro de la ficha | `SGR_PERIODO`, `SGR_HECHO` |
| Hechos de suministro y ajustes de la línea de tiempo | `POST /api/v1/servicios/{servicio}/hechos`, `PUT /api/v1/servicios/{servicio}/hechos/{hecho}` y sufijos `anular` o `reactivar` por POST | `hecho.registrar`, `hecho.actualizar`, `hecho.anular` y centro de la ficha | `SGR_HECHO`, `SGR_SERVICIO`, `SGR_PERIODO` |

Se reutilizan los permisos de `perfiles.js`, `menu.js` y `routes.js`. Se agregan al ERD la precisión del inicio y los identificadores y autores históricos de hechos para reproducir fechas parciales, enlaces y textos del prototipo. El DDL de esta etapa se limita a sus tres tablas. La importación inicial conserva los identificadores de la SPA y registra solo servicios ausentes.

### Resultados de la etapa 4

Oracle prevalidó 34 nombres. La primera generación alcanzó a crear `SGR_HECHO`. Se corrigió el mapeo del motivo pendiente y se reanudó sobre los tres objetos de la etapa, conservando el DDL de las 20 tablas previas. La carga importó un servicio, diez períodos y seis hechos. Pasaron la compilación de Vue, el paquete Java con 11 pruebas y la prueba REST de ámbito, pagos, periodicidad, correcciones y reactivación.

## Etapa 5 — Movilidad, itinerarios y combustible

Persistir la ficha operativa del vehículo, el itinerario manual o trazado, la ejecución separada de la previsión y el registro de carga o consumo. Mantener la comparación orientativa, Mi jornada, el mapa y los avisos con los datos autorizados. La ruta almacena puntos y geometría ordenados en WGS 84. Un único consumo vigente puede referenciar un recorrido ejecutado; el consumo deriva el vehículo desde el itinerario. El perfil Chofer conserva su alcance por vehículo real y corrige únicamente sus registros de combustible.

| Pantalla o flujo | Endpoint | Permiso y ámbito | Tablas |
| --- | --- | --- | --- |
| Vehículos, ficha operativa y contexto de mantenimiento de centros | `GET /api/v1/vehiculos` | Rutas `vehiculos` o `centros`; asignación global, centro o vehículo según corresponda | `SGR_VEHICULO`, `SGR_CENTRO` |
| Alta, actualización y baja lógica de vehículos | `POST /api/v1/vehiculos`, `PUT /api/v1/vehiculos/{vehiculo}`, sufijos `anular` y `reactivar` por POST | `vehiculo.registrar`, `vehiculo.actualizar`, `vehiculo.anular`; centro de destino o del registro | `SGR_VEHICULO` |
| Itinerarios, mapa, ejecución y Mi jornada | `GET /api/v1/itinerarios`, `POST /api/v1/itinerarios`, `PUT /api/v1/itinerarios/{itinerario}`, sufijos `ejecucion`, `anular` y `reactivar` por POST | Ruta `itinerarios`, acciones `itinerario.registrar`, `itinerario.actualizar`, `itinerario.ejecucion`, `itinerario.anular`; vehículo del recorrido | `SGR_ITINERARIO`, `SGR_VEHICULO`, `SGR_COMBUSTIBLE` |
| Combustible, cargas, consumos y comparación | `GET /api/v1/combustible`, `POST /api/v1/combustible`, `PUT /api/v1/combustible/{registro}`, sufijos `anular` y `reactivar` por POST | Ruta `combustible`, acciones `combustible.informar`, `combustible.actualizar`, `combustible.actualizarPropio`, `combustible.anular`; vehículo del registro y autor cuando aplica | `SGR_COMBUSTIBLE`, `SGR_ITINERARIO`, `SGR_VEHICULO`, `SGR_USUARIO` |

La etapa genera solo sus tres tablas. Las referencias de autor de la demostración se conservan y los registros de Chofer se vinculan con su cuenta. La resolución de ámbitos y la asignación de usuarios consultan `SGR_VEHICULO` sin depender de los ejemplos. El ERD pasa a 7.7.0.

### Resultados de la etapa 5

La prevalidación revisó 32 nombres con cero colisiones. Hibernate creó `SGR_VEHICULO`, `SGR_ITINERARIO` y `SGR_COMBUSTIBLE`. Se conservaron los identificadores y las fechas DDL de 23 tablas previas. La carga inicial produjo dos vehículos, cuatro itinerarios y cinco registros de combustible. Pasaron 12 pruebas JUnit/MockMvc, la compilación de Vue y la prueba REST de trazado, ejecución, consumo exclusivo, corrección propia y reversión.

## Integración final — Fotografías, intervenciones y mantenimientos

Persistir las fichas y archivos con los mismos permisos del prototipo. La presentación, los informes, el mapa y el manual mantienen su navegación. Las preferencias locales de UI y el contenido editorial del manual se conservan como tales. Las colecciones operativas se hidratan exclusivamente por REST. Los archivos de demostración se usan al importar datos en el backend. Las escrituras muestran el error y conservan el formulario si la API falla, y un reintento explícito obtiene un token CSRF vigente cuando corresponde.

| Pantalla o flujo | Endpoint | Permiso y ámbito | Tablas |
| --- | --- | --- | --- |
| Galería del centro, ambiente o bien y su contenido | `GET /api/v1/fotos`, `GET /api/v1/fotos/{id}/contenido` | Ruta `centros`; centro resuelto desde el objetivo de la foto | `SGR_FOTO`, `SGR_CENTRO`, `SGR_AMBIENTE`, `SGR_BIEN` |
| Incorporar, reemplazar, anular o reactivar una foto | `POST /api/v1/fotos`, `PUT /api/v1/fotos/{id}`, sufijos `anular` y `reactivar` por POST | `centro.foto`, `foto.actualizar`, `foto.anular`; se conserva el centro y el tipo de objetivo permitido | `SGR_FOTO` |
| Intervenciones y último pintado | `GET /api/v1/intervenciones`, `POST /api/v1/intervenciones`, `PUT /api/v1/intervenciones/{id}`, sufijos `anular` y `reactivar` por POST | Ruta `centros`, acciones `intervencion.registrar`, `intervencion.actualizar`, `intervencion.anular`; ámbito del ambiente | `SGR_INTERVENCION`, `SGR_AMBIENTE` |
| Seguridad y mantenimiento, historial, alertas y estado del vehículo | `GET /api/v1/mantenimientos`, `POST /api/v1/mantenimientos`, `PUT /api/v1/mantenimientos/{id}`, sufijos `anular` y `reactivar` por POST | Rutas `centros` o `vehiculos` para consulta según objetivo; `mantenimiento.*` para escritura, más `vehiculo.actualizar` si el registro lo deja operativo | `SGR_MANTENIMIENTO`, `SGR_VEHICULO`, `SGR_BIEN`, `SGR_CENTRO`, `SGR_CATALOGO` |

Agregar identificadores públicos y datos históricos de autor a las tres tablas nuevas. La imagen persiste en el BLOB y la descarga requiere el mismo ámbito de la ficha. El último pintado aumenta cuando se registra un pintado posterior, conservando la regla actual. El alta de mantenimientos para varios objetivos y el cambio opcional de condición operativa se ejecutan en una transacción. La suite E2E final queda reservada al agente indicado por el usuario.

Para la generación acotada se emplean `--sigrec.ddl.etapa4=true`, `--sigrec.ddl.etapa5=true` y `--sigrec.ddl.integracion=true`, una opción por arranque y previa inspección del DDL y del diccionario. El arranque ordinario usa `validate`. La carga de cada fotografía admite 5 MB de archivo y la solicitud multipart incluye un margen para el sobre y la ficha.

### Resultados de la integración

- Oracle prevalidó 30 nombres y creó `SGR_FOTO`, `SGR_INTERVENCION` y `SGR_MANTENIMIENTO`. Los identificadores y las fechas de DDL de las 26 tablas previas coincidieron con la prevalidación. Dos arranques con `validate` y carga de demostración dejaron cinco fotografías, siete intervenciones y nueve mantenimientos. El validador del ERD 7.8.0 aceptó sus 29 tablas.
- Pasaron `mvn compile`, `mvn test`, `mvn package` y `npm run build`. Las 14 pruebas JUnit/MockMvc cubrieron contratos y permisos. Las pruebas REST en Oracle cubrieron las etapas 4 y 5, el BLOB y su ámbito, el último pintado, el mantenimiento transaccional y la regresión de las etapas 1 a 3. Se verificó la recuperación del cliente tras un fallo de conexión y la renovación de CSRF para un reintento explícito.
- La comparación dirigida de Playwright cubrió 17 vistas con los cuatro perfiles. Coincidieron menús autorizados, contenido y diálogos, con normalización de las transiciones de grupos del menú. La galería y el formulario de fotos muestran la descripción correspondiente a la persistencia. El servidor acepta imágenes JPEG, PNG, GIF, WebP, BMP y AVIF de hasta 5 MB. Durante un guardado se deshabilita el envío y el formulario conserva la edición si falla la API.
- La SPA no importa JSON de demostración durante la operación. Se anularon o desactivaron los registros de prueba y se cerraron los servidores de verificación.

