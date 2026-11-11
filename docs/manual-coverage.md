# Matriz de cobertura del manual

La jerarquía documentada es Centro → Módulo → Ambiente → Bien → Componente. La aplicación ofrece 14 capítulos mediante el catálogo central. Cada entrada del catálogo contiene temas buscables y duraciones medidas desde los medios publicados.

El [índice de demostraciones](manual-demonstrations.md) relaciona las explicaciones grabadas con su capítulo e instante. Se genera junto con los medios para evitar referencias a tiempos antiguos.

| Capítulo | Demostraciones y funcionalidades |
| --- | --- |
| 01 · Inicio | Menú, grupos, buscador global, indicadores, avisos actuales y próximos, filtros, contexto de retorno y acceso al manual |
| 02 · Centros, módulos y ambientes | Alta, fichas, actualización, características, infraestructura, elementos adicionales y descendientes de los tres niveles |
| 03 · Bienes y componentes | Alta, registro sucesivo, inventario previo, actualización, adquisición, verificación, traslado, asociación, desasociación, componentes y revisión del principal dado de baja |
| 04 · Incidentes | Origen, afectados, unidades, decisión de reposición, baja previa, alta del reemplazo, consultas, filtros y antecedentes |
| 05 · Infraestructura | Fotografías, visor, incorporación y corrección, novedades, atención, intervenciones, fumigación, mantenimiento y recargas en lote |
| 06 · Necesidades | Clasificación, consulta, consolidado, valoración, tipos de bien, precios, filtros, paginación, simulador y CSV |
| 07 · Inventario | Resumen, categorías, consulta por equipo, detalle, verificación, mal estado, exportaciones y necesidades |
| 08 · Servicios | Proveedor, periodicidad, contacto, períodos, pagos, pendientes, interrupciones, restablecimiento y corrección de hechos |
| 09 · Vehículos | Alta, ficha, estado operativo, rendimiento, presupuesto, mantenimiento y operación posterior |
| 10 · Itinerarios | Programación, ejecución, mapa, puntos, orden, retorno al origen, ámbito, cálculo explicado y completar rendimiento con retorno |
| 11 · Combustible | Carga, consumo por recorrido, litros, sustento, autor y comparación |
| 12 · Perfiles | Ámbitos, permisos, verificación en lote, ingreso de rótulos y jornada del chofer |
| 13 · Acciones comunes | Anulaciones, reactivación, motivos, dependencias, reversión patrimonial, captura rápida, descartes, Deshacer, ayuda y salidas de error |
| 14 · Móvil y dictado | Controles de voz, permisos, ayuda de micrófono y límites del entorno |

## Límites

Cámara, geolocalización física y transcripción exitosa requieren validación con hardware real. El material no presenta resultados simulados como verificaciones exitosas. Los datos de la demostración son ficticios y temporales.

## Producción

`scripts/manual-record.mjs` regraba en una instancia existente, con contornos aplicados al elemento y retirados antes de actuar. `manual-finalize.mjs` sincroniza narración e identificación del capítulo; `manual-media.mjs clean` publica los capítulos y WebVTT y mide su duración. El maestro y los intermedios permanecen fuera de Git.
