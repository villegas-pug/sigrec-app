package pe.gob.inabif.sigrec.vehiculo.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateVehiculoRequest(@NotBlank @Size(max = 40) String carId,
        @NotNull @Valid VehiculoDatos datos) {}
