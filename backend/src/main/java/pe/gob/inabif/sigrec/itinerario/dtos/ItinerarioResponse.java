package pe.gob.inabif.sigrec.itinerario.dtos;

import java.time.LocalDate;
import java.util.List;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record ItinerarioResponse(String id, String vehiculoId, LocalDate fecha, String proposito, List<String> destinos,
        ItinerarioDatos.Tramo previsto, ItinerarioDatos.Tramo realizado, ItinerarioDatos.Ruta ruta, Sello anulacion) {}
