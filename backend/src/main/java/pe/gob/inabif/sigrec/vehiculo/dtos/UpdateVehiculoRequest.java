package pe.gob.inabif.sigrec.vehiculo.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record UpdateVehiculoRequest(@NotNull @Valid VehiculoDatos datos) {}
