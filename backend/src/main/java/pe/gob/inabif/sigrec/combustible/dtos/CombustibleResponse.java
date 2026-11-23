package pe.gob.inabif.sigrec.combustible.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record CombustibleResponse(String id, String vehiculoId, String itinerarioId, LocalDate fecha, String tipo,
        BigDecimal cantidad, String sustento, String informadoPor, boolean propio, Sello anulacion) {}
