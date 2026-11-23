# SPEC 041 — Carga de datos por pantalla y una sola llamada para Inicio

Reemplaza la carga completa tras el ingreso de la SPEC 037 («las colecciones operativas se hidratan exclusivamente por REST»). Los datos siguen viniendo solo de REST, pero se piden cuando una pantalla los necesita.

## Problema

Tras el ingreso se descargaban las 15 colecciones antes de mostrar nada. La pantalla de Inicio calculaba en el navegador, con todas ellas, los indicadores y los avisos de atención, y para eso hacía una llamada por colección. La experiencia era lenta y el ámbito de vehículos dependía de que el menú incluyera «Gestión de centros».

## Decisiones

### Carga por pantalla con caché por sesión
- Cada ruta declara en `meta.datos` los grupos que necesita: `jerarquia`, `inventario`, `tiposBien`, `tiposBien:precios`, las colecciones `servicios`, `vehiculos`, `itinerarios`, `combustible`, `fotos`, `intervenciones`, `mantenimientos` y el compuesto `inicio`.
- `services/cargaDatos.js` guarda una promesa por grupo. La primera visita a una pantalla carga lo suyo; volver a ella no hace llamadas. Se vacía al cerrar la sesión y al cambiar de usuario. Un fallo no se guarda: se puede reintentar.
- La carga la dispara el layout **antes** de montar la pantalla, no `onMounted`: las pantallas leen los enlaces profundos (`?bien=`, `?vehiculo=`…) una sola vez al crearse y necesitan los datos ya cargados. Mientras tanto se muestra un indicador de carga; si todo está en caché no hay espera.
- Las escrituras actualizan la colección en memoria, por lo que la caché sigue vigente.
- El buscador global carga sus grupos al abrirse. Las acciones de «Atención requerida» aseguran los grupos que su diálogo necesita antes de abrirlo.
- El layout no carga datos de negocio; solo `GET /api/v1/catalogos`.

### Una sola llamada para Inicio
- `GET /api/v1/inicio/datos` devuelve, en una respuesta, `jerarquia`, `inventario`, `tiposBien`, `precios`, `servicios`, `vehiculos`, `itinerarios`, `combustible` y `mantenimientos`. Cada parte tiene exactamente la forma de su endpoint individual: el backend solo compone los servicios existentes, sin duplicar reglas ni consultas.
- Los indicadores y avisos se siguen calculando en el navegador con las mismas reglas que usan las pantallas de detalle, de modo que sus cifras coinciden. Se descartó portar esas reglas (≈1.450 líneas y un modelo de eventos derivado) a Java por el riesgo de que las cifras difieran.
- La respuesta solo aplica los grupos que faltaban: reemplazar uno ya cargado desconectaría los objetos que las pantallas conservan.
- Tras el ingreso, si el menú incluye Inicio, el layout pide `inicio` en segundo plano (sin bloquear la pantalla): el contador de la campana solo es fiable con todas las colecciones. Mientras no estén, informa «sin avisos».

### Pendiente
- Si el volumen de datos crece, calcular indicadores y avisos en el backend (un endpoint de resumen con textos entregados como datos) sigue siendo la mejora natural; requiere portar las reglas con pruebas de equivalencia.
