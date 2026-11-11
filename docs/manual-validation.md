# Revisión del manual integrado

Revisión local del 11 de noviembre de 2026 sobre la instancia existente de SIGREC. No se iniciaron servidores ni se ejecutaron builds o suites de pruebas.

| Comprobación | Resultado observado |
| --- | --- |
| Perfiles | El manual está disponible para Equipo central, Personal del CAR, Verificación física y Chofer; se mantienen sus rutas iniciales |
| Búsqueda | Encuentra capítulos por palabras de la funcionalidad, incluidas «registrar bien» e «informar pago» |
| Enlaces y navegación | Enlace a Servicios con `t=30`, Atrás y conservación del mismo elemento de video al cambiar de capítulo |
| Entradas inválidas | Capítulo desconocido muestra aviso; instante negativo o excesivo se limita al rango del medio |
| Reproducción | Comienza pausada; Ver todo inicia la secuencia y avanza al siguiente; seleccionar de nuevo pausa y vuelve al inicio |
| Descarga y pantalla completa | Descarga de `services.mp4` completada; reproductor en pantalla completa |
| Ayuda contextual | Desde Gestión de centros abre su capítulo y vuelve conservando `ambiente=AMA-D1` |
| Medio ausente | Muestra error sin perder el índice; Reintentar recupera el medio correcto |
| Presentación | Índice lateral en escritorio y debajo del reproductor en móvil de 390 × 844 |
| Subtítulos | Una pista WebVTT visible en el navegador; cada entrada contiene número y título de capítulo; pista `mov_text` incluida en cada descarga |
| Producción | 21 tomas completadas sin errores de guion; 14 capítulos H.264 de 1920 × 1080 con audio AAC |
| Tamaños y duración | Duración total medida: 28:33; aproximadamente 172 MiB; archivo máximo: 47,57 MiB, por debajo de 100 MiB |
| Comprobaciones estáticas | Sintaxis de JavaScript y bloques Vue, estructura de los subtítulos, duraciones, resolución y `git diff --check` sin errores |

Se revisaron fotogramas de la captura limpia y su presentación final con subtítulos. Los resaltados pertenecen al elemento real y se retiran antes de actuar; la identificación del capítulo ocupa una franja exterior a la interfaz. El maestro anterior permanece intacto fuera de Git.

Cámara, ubicación física y transcripción exitosa siguen pendientes de validación con dispositivos reales. El capítulo correspondiente explica estas limitaciones. No se realizaron commits, push ni publicación externa.
