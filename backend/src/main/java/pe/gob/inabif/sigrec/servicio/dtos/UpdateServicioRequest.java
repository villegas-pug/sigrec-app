package pe.gob.inabif.sigrec.servicio.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record UpdateServicioRequest(@Pattern(regexp = PERIODICIDADES) String periodicidad,
        @Valid @NotNull ServicioDatos datos) {
    public static final String PERIODICIDADES = "mensual|bimestral|trimestral|cuatrimestral|semestral|anual";
}
