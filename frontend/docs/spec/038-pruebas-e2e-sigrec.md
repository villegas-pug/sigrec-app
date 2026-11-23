# SPEC 038 — Pruebas E2E de SIGREC

## Objetivo y alcance

Comprobar la integración de Vue, Spring Boot y Oracle de la SPEC 037 con los cuatro perfiles demo, sus rutas, acciones y ámbitos. La suite objetivo debe cubrir autenticación y revocación; jerarquía, fotos, intervenciones y mantenimientos; inventario e incidencias; planificación, precios y CSV; servicios y pagos; movilidad y combustible. Debe incluir rechazos 401, 403, 404 y 409, CSRF, validación, recuperación ante caída y persistencia tras recarga y reinicio.

Las pruebas que escriban deben identificar inequívocamente sus registros, conservar sus identificadores y anularlos o desactivarlos aun ante fallos. La limpieza debe poder repetirse y no debe modificar datos ajenos en el esquema compartido. Las contraseñas se leen exclusivamente del entorno local y no se registran.

La batería de escritura usa un centro dedicado con nombre `E2E-<identificador>`. Antes del alta comprueba que el código de tres letras no exista y registra en un diario local ignorado tanto el código como el nombre. La recuperación solo actúa si ambos coinciden, identifica descendientes por ese centro y anula en orden inverso de dependencia. El diario permanece cuando una limpieza falla; se elimina únicamente tras comprobar la anulación. Nunca se limpian registros por un prefijo genérico ni se eliminan filas físicamente.

## Estado y resultados

La suite se ejecutó completa contra Oracle con el backend en `validate`, sin semillas ni importación: lectura, escrituras por REST, formularios de Vue y persistencia tras reiniciar. Los resultados de la SPEC 037 no sustituyen a esta ejecución.

| Cobertura prevista | Estado |
| --- | --- |
| Login, logout, revocación, menú, permisos y guardas de los cuatro perfiles | Aprobado para las rutas del menú y comparación de permisos; falta inspeccionar todas las acciones visibles por recurso |
| Centros: jerarquía, foto y contenido, intervención y mantenimiento | Aprobado desde Vue: alta, edición de ficha y rechazo de duplicado del centro, edición de ambiente, incorporación de fotografía, intervención y fumigación; contenido de la foto por REST |
| Inventario: ficha, traslado, verificación, condición, anulación, reactivación, baja y reposición | Aprobado desde Vue: verificación, traslado, baja, cambio de condición, anulación, reactivación y reposición |
| Novedad y atención | Aprobado desde Vue: registro de incidente y atención de una novedad |
| Planificación y precios: historial, simulador y CSV | Aprobado desde Vue: alta de tipo de bien y de precio, simulador y descarga del CSV con su contenido (encabezado, filas y separador) |
| Servicios y pagos: períodos, correcciones y hechos | Aprobado desde Vue: alta de servicio, interrupción, pago de un período y corrección de su situación |
| Movilidad y combustible: vehículo, itinerario, consumo y ámbito del chofer | Aprobado desde Vue: vehículo, itinerario del chofer, ejecución, carga de combustible, consumo declarado y denegación de Gestión de centros. El selector de trazado en mapa se abre; no se verifican teselas ni el trazo |
| Negativos 401, 403, 404, 409, CSRF y validación | Aprobado en casos seleccionados; falta matriz exhaustiva por endpoint y ámbito |
| Caída de API con borrador conservado | Aprobado en el alta de centro con fallo de red simulado; falta comprobar reintento y otros formularios |
| Persistencia tras recarga y reinicio | Aprobado para un centro; faltan entidades y recorridos restantes |

## Ejecución

Con Oracle accesible, cargar las variables de `backend/.env.local` en el entorno del proceso, levantar el backend con `ddl-auto=validate` y sin semillas y el frontend en `127.0.0.1:9000`. Desde `frontend/`, ejecutar `node e2e/smoke.cjs`, `node e2e/escrituras.cjs` y `node e2e/interfaz.cjs`, con el paquete `playwright` accesible a Node. Puede usarse la instalación existente de Playwright CLI indicando en `NODE_PATH` el directorio que contiene ese paquete; no se añade una dependencia al proyecto. Para `node e2e/persistencia.cjs`, dejar activo el frontend y libre el puerto 8080: la prueba inicia y detiene su propio backend dos veces, usando el JAR de `mvn package`. La batería cierra sus contextos y navegador incluso si falla. No registrar las variables ni guardar estados de autenticación.

Si existe `frontend/artifacts/e2e/escrituras-pendientes.json`, conservarlo y ejecutar `escrituras.cjs` con el backend disponible: intenta recuperar el registro antes de crear otro. Si la recuperación falla, investigar el mensaje y conservar el diario. No modificar registros que no coincidan con sus identificadores y marcadores.

## Resultados observados

- `mvn test`: 14 pruebas aprobadas, sin fallos, errores ni omisiones.
- `mvn package`: correcto, con las mismas 14 pruebas aprobadas.
- `npm run build`: correcto; Vite advirtió que `motorWhisper.js` se importa tanto estática como dinámicamente.
- `node e2e/smoke.cjs`: 100 comprobaciones aprobadas en las cuatro cuentas.
- `node e2e/escrituras.cjs`: 95 comprobaciones aprobadas, con limpieza de recursos propios ejecutada dos veces.
- `node e2e/interfaz.cjs`: borrador conservado ante fallo de red, simulación y descarga CSV aprobados.
- `node e2e/persistencia.cjs`: recarga, reinicio real del backend y doble anulación del centro aprobados.
- No se corrigieron bugs de aplicación. Se corrigieron expectativas de la prueba: el recurso fuera de ámbito devuelve 404 y el perfil central tiene cinco permisos administrativos adicionales; también se esperó al montaje de la ruta y se corrigió el selector del simulador.

## Riesgos y trabajo pendiente

Los escenarios de escritura interactúan principalmente mediante REST, no mediante los formularios de Vue. Faltan los recorridos y variantes señalados en la matriz y la comprobación de cada acción visible. Los eventos históricos de verificación, traslado y condición, y los períodos y precios históricos, carecen de operación pública independiente de anulación; se anulan sus bienes, servicios o tipos propietarios, pero no se ha demostrado que cada fila histórica quede desactivada individualmente. Revisar este límite con el dueño del esquema antes de afirmar que toda fila creada queda desactivada. No se hizo limpieza física ni se modificaron registros ajenos.

## Verificación independiente y flujos de interfaz (21/11/2026)

Tras agotarse el límite de uso del agente de pruebas, se repitió la ejecución completa con el backend (`SIGREC_DDL_AUTO=validate`, sin semillas) y el frontend en `127.0.0.1`, cargando las variables de `backend/.env.local` sin retornos de carro.

| Comando | Resultado |
| --- | --- |
| `mvn test` (backend) | 14 pruebas, 0 fallos, 0 errores, 0 omitidas |
| `npm run build` (frontend) | Correcto (aviso conocido de `motorWhisper.js`) |
| `node e2e/smoke.cjs` | 100 comprobaciones aprobadas |
| `node e2e/escrituras.cjs` | 95 comprobaciones aprobadas, con limpieza de recursos propios |
| `node e2e/interfaz.cjs` | Borrador conservado ante fallo de red, simulación y CSV aprobados |
| `node e2e/persistencia.cjs` | Recarga, reinicio real del backend y doble anulación aprobados |
| `node e2e/flujos-ui.cjs` | 5 comprobaciones aprobadas: alta de centro desde el formulario de Vue, rechazo del código duplicado con borrador conservado, persistencia tras recargar y limpieza |
| `node e2e/flujos-modulos.cjs` | 28 comprobaciones aprobadas: servicios (alta, interrupción, pago y corrección), vehículo, itinerario, ejecución, combustible y consumo declarado, incidente y atención, precio, inventario (verificación, traslado, baja, condición, anulación, reactivación y reposición), ambiente, intervención, fotografía, fumigación, ficha de centro, selector de mapa y contenido del CSV, todo desde los formularios de Vue |

`flujos-ui.cjs` ejecuta el formulario real de Vue (alta de centro y rechazo de duplicado) y anula en un bloque `finally` el centro creado, de modo que la limpieza se repite aunque falle la prueba.

**Cuidado al ejecutar:** al cargar `backend/.env.local` desde un shell POSIX, las variables deben leerse sin el retorno de carro (`\r`) final. Un valor con `\r` provoca un 401 en las llamadas REST, aunque el formulario de Vue sí funciona porque el navegador descarta ese carácter.

## Riesgos conocidos

- `flujos-modulos.cjs` limpia los datos que crea reutilizando la recuperación del diario de `escrituras.cjs`, que anula los tipos de bien propios después de sus bienes y las fotografías de sus ambientes.
- Los eventos históricos y los períodos o precios históricos no tienen anulación individual pública; quedan desactivados al anular a su propietario.
- El selector de trazado en mapa se comprueba solo hasta que aparece; no se validan las teselas externas ni el trazo.
- Falta una matriz exhaustiva de negativos 404, 409 y validación por cada endpoint y ámbito; se cubren casos representativos por módulo.

> SPEC 039: los casos de login, logout, revocación y CSRF quedaron sin efecto. La identidad llega de la intranet (`?p=`) y el API no usa cookies; las pruebas de perfiles requieren un SRH de prueba.

## Revalidación de persistencia compatible con SPEC 039 (23/11/2026)

- `node e2e/persistencia-intranet.cjs crear` y `node e2e/persistencia-intranet.cjs verificar` aprobaron contra el frontend Quasar, el proxy REST real y Oracle: alta y edición desde Vue de centro, vehículo, carga de combustible, servicio, mantenimiento preventivo, módulo, ambiente y bien, además de alta, edición, anulación y reactivación de una incidencia. Combustible y bien también se anularon y reactivaron desde Vue. Después de reiniciar Spring Boot, el modo `verificar` confirmó por API las nueve entidades y sus valores editados.
- Las validaciones UI incluyeron proveedor vacío y teléfono inválido en servicios; fecha realizada vacía/futura, próxima fecha anterior e importe negativo en mantenimiento; fecha de combustible vacía/futura y cantidad no positiva; nombre/pisos de módulo y capacidad negativa; nombre de ambiente; campos requeridos y cantidad no positiva de bien; y motivo, fecha futura y decisión de reposición de incidencia. También se probó capacidad de módulo nula y luego cero, según SPEC 020 y SPEC 043.
- Tras comprobar persistencia post-reinicio, las filas E2E se anularon lógicamente en orden de dependencias: combustible, vehículo, servicio, mantenimiento, incidencia, bien, ambiente, módulo y centro. Los sellos se verificaron antes de retirar el diario. Hubo ejecuciones parciales recuperadas con el diario, sin eliminar físicamente datos.
- SRH se simuló con la respuesta de ingreso y menú; no se probaron sus servidores reales. El backend se inició con `PROFILE=dev`, `SIGREC_DDL_AUTO=validate`, `SIGREC_SEED=never`, `SIGREC_IMPORTAR_DEMO=false` y autorización del API desactivada. No se ejecutó DDL, semillas ni borrado físico.
- La prueba reserva identificadores libres, registra los datos e identidad en `C:\Users\uti.rguevara_01\AppData\Local\Temp\opencode\sigrec-persistencia-intranet-pendiente.json` antes de escribir y conserva el diario si una fase falla. Solo lo elimina después de verificar las anulaciones lógicas. La identidad fija `e2e.persistencia.sigrec` queda aprovisionada como usuario E2E sin asignaciones para reutilizarla en ejecuciones posteriores.
- La SPEC 037 identifica el esquema Oracle 19c `USRSEGURIDAD` como esquema de pruebas; la inspección de solo lectura confirmó que la conexión usa el esquema configurado, aunque el nombre DB/servicio no contiene un marcador reconocible de test/dev. La prueba se limitó a registros E2E únicos y baja lógica.
- Este recorrido aporta evidencia integrada para estos nueve recursos y una carga de combustible; no cubre el consumo asociado a un itinerario ni sustituye la matriz E2E completa. Siguen pendientes otras pantallas, variantes y endpoints, una matriz exhaustiva de errores por API/ámbito, pruebas de regresión globales y la integración con SRH real. La suite no acredita por sí sola todos los módulos ni todas las funcionalidades solicitadas.
