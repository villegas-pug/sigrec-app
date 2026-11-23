package pe.gob.inabif.sigrec.centro.dtos;

import pe.gob.inabif.sigrec.centro.dtos.CentroDatos.Fundacion;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos.Seguridad;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InmuebleResponse(String direccion, Fundacion fundacion, String condicion, String arrendador,
                              LocalDate contratoHasta, String litigios, Seguridad seguridad, Construccion construccion,
                              Sello actualizado) {
    public record Construccion(String material, String antiguedad, String antiguedadNota, Integer pisos, BigDecimal areaM2,
                               BigDecimal areaTerrenoM2, String estado, String caracteristicas) {}
}
