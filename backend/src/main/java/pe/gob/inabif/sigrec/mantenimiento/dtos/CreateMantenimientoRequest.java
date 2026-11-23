package pe.gob.inabif.sigrec.mantenimiento.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CreateMantenimientoRequest(@NotBlank @Size(max = 40) String carId, @NotBlank @Size(max = 40) String tipo,
        @NotNull @Size(max = 100) List<@NotBlank @Size(max = 80) String> objetivos,
        boolean quedaOperativo, @NotNull @Valid MantenimientoDatos datos) {}
