package pe.gob.inabif.sigrec.modulo.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;


public record ModuloResponse(String id, String carId, String nombre, String tipo, Integer capacidad, Integer pisos,
                      BigDecimal areaM2, String condicion, String ubicacion, Sello anulacion) {}
