package pe.gob.inabif.sigrec.ambiente.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;


public record AmbienteResponse(String id, String carId, String moduloId, String nombre, Integer piso, String bloque, String ubicacion,
                        BigDecimal areaM2, Integer puertas, Integer ventanas, String condicion, YearMonth ultimoPintado, Sello anulacion) {}
