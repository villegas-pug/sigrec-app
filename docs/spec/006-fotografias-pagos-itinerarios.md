# SPEC 006 — Fotografías, pagos e itinerarios

- Estado: en implementación. Prototipo en memoria con datos ficticios.
- Bienes y componentes: galería propia con fotografías individuales, validación de 5 MB, edición y anulación lógica.
- Pagos: detalle antes de editar; fecha, importe positivo y sustento obligatorios al informar pagos; datos de demostración completos.
- Itinerarios: selección ordenada de puntos en mapa, ruta vial OSRM y distancia prevista automática. La distancia realizada se confirma por separado.
- Los servicios cartográficos externos reciben coordenadas y pueden no estar disponibles; se ofrece ingreso manual.
- Las comprobaciones ejecutables requieren autorización explícita.
