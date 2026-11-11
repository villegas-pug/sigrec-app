# SPEC 026 — Manual audiovisual integrado

## Objetivo
Integrar un manual de 14 capítulos con la jerarquía Centro → Módulo → Ambiente → Bien → Componente. El maestro se conserva localmente. Los medios finales se sirven con la aplicación, sin backend ni alojamiento adicional.

## Interfaz
Entrada final «Manual de usuario», disponible para los cuatro perfiles, sin cambiar sus rutas iniciales. Índice buscable por título y temas, reproductor nativo, navegación anterior/siguiente, reproducción consecutiva explícita, copia de enlace y descarga. En móvil el índice aparece debajo del reproductor. Ruta `manual?chapter=<id>&t=<segundos>`. El componente permanece montado al cambiar la consulta. Una selección inválida informa el problema y permite elegir otro capítulo; el tiempo se limita a la duración real. Los fallos de carga mantienen disponible el índice y ofrecen reintento.

## Medios y accesibilidad
Catálogo central con identificadores estables, duraciones medidas, temas y rutas. MP4 H.264 1080p, capítulos menores de 100 MiB y subtítulos WebVTT con capítulo en cada entrada; subtítulos integrados para descarga. Revisión de resaltados y textos incrustados antes de considerar terminada la renovación audiovisual. No simular cámara, voz ni geolocalización.

## Validación
Comprobaciones estáticas, inspección de medios y revisión manual en la instancia existente. Sin builds, servidores, suites de pruebas, commits, push ni publicación sin autorización. Conservar los cambios anteriores de navegación.

## Implementación y gestión
Vue y Quasar con reproductor HTML nativo. `src/config/manual.js` reúne los identificadores, temas, rutas, medios y duraciones. `public/manual/v1/` contiene los 14 MP4, WebVTT y portadas. La clave de montaje del manual usa el nombre de ruta para conservar el reproductor al cambiar de capítulo o instante. Se descarga el medio anterior y solo se precargan metadatos del seleccionado.

La ayuda de cada pantalla utiliza el retorno existente del historial, que conserva la consulta y el estado de origen. Todos los perfiles consultan el manual; los enlaces hacia pantallas funcionales aplican sus permisos actuales. Cada MP4 incorpora una pista de subtítulos para descarga y la web activa exclusivamente la pista WebVTT, evitando duplicarla.

Los guiones reproducibles, la producción local y la matriz se versionan. Capturas, voz intermedia, herramientas y maestro permanecen en `artifacts/manual-usuario/`, excluido específicamente de Git. Se mantiene el maestro anterior sin modificar.
