package pe.gob.inabif.sigrec.servicio.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateServicioRequest(@NotBlank @Size(max = 40) String carId,
        @NotBlank @Size(max = 40) String tipo,
        @NotNull @Pattern(regexp = UpdateServicioRequest.PERIODICIDADES) String periodicidad,
        @Valid @NotNull ServicioDatos datos) {}
