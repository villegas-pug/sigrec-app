# SPEC 042 — Carga progresiva de Inicio

## Objetivo

Mostrar Inicio después de validar la sesión y el menú, sin esperar la descarga de sus datos. Las cifras y los avisos solo se muestran cuando los catálogos y las colecciones necesarias están completos.

## Decisiones

- Inicio administra su carga y presenta estados accesibles de espera y error con reintento. Las demás rutas conservan la carga previa al montaje de la SPEC 041 para preservar los enlaces profundos.
- El encabezado no solicita anticipadamente las colecciones de Inicio. Mientras no estén disponibles, la campana indica que los avisos no se han cargado, no que no existen.
- Los diálogos de atención se importan al necesitarlos. Se mantienen los permisos, la navegación contextual y las reglas de cálculo existentes.
- La respuesta `/inicio/datos` sigue siendo completa; esta mejora reduce la espera percibida y evita la precarga desde otras pantallas, pero no reduce su tamaño ni separa los indicadores de la tabla.
- Un resumen calculado en el backend requiere trasladar las reglas y verificar su equivalencia antes de sustituir los cálculos existentes. Queda pendiente junto con las mediciones comparativas en producción.
