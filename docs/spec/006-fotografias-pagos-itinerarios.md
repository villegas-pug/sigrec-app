# SPEC 006 — Fotografías, pagos e itinerarios

- Estado: en implementación. Prototipo en memoria con datos ficticios.
- Bienes y componentes: galería propia con miniaturas 4:3, visor accesible y descarga individual del archivo original; nombre de archivo opcional, validación de 5 MB, edición y anulación lógica. Las imágenes no disponibles muestran un marcador.
- Pagos: detalle antes de editar; fecha, importe positivo y sustento obligatorios al informar pagos; datos de demostración completos.
- Itinerarios: selección ordenada de puntos en mapa, ruta vial OSRM y distancia prevista automática. La distancia realizada se confirma por separado.
- Los servicios cartográficos externos reciben coordenadas y pueden no estar disponibles; se ofrece ingreso manual.
- Las comprobaciones ejecutables requieren autorización explícita.

## Ubicación y búsqueda de itinerarios

- En un itinerario nuevo, al abrir el mapa se solicita una vez la ubicación del dispositivo y se propone como origen; el usuario puede modificarla o eliminarla.
- Al editar se conservan los puntos registrados. La búsqueda Photon muestra sugerencias en Perú y una previsualización que se confirma antes de añadir el punto.
- Las búsquedas y el cálculo de rutas utilizan servicios externos configurables. Se conserva el ingreso manual ante fallos.
- La ruta y sus kilómetros solo cambian al confirmar o modificar puntos. El prototipo no realiza seguimiento de ubicación.

## Búsqueda de direcciones en Lima

- La búsqueda prioriza la ubicación conocida del dispositivo o Lima y limita los resultados a Perú. La interfaz permanece en español; Photon devuelve los nombres locales disponibles.
- Distinguir ausencia de resultados de indisponibilidad del servicio y permitir reintentar. Una solicitud obsoleta no puede cerrar ni reemplazar las sugerencias actuales.

## Navegación del mapa de itinerarios

- «Ver todos los puntos» ajusta el mapa a los puntos confirmados; «Ir al origen» centra el primer punto de la lista.
- Cada punto permite centrarlo desde su fila, tanto al editar como en consulta. Los controles no modifican la ruta ni la previsualización.
