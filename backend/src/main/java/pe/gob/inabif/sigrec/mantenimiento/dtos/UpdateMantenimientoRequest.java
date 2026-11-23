package pe.gob.inabif.sigrec.mantenimiento.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateMantenimientoRequest(@NotNull @Valid MantenimientoDatos datos) {}
