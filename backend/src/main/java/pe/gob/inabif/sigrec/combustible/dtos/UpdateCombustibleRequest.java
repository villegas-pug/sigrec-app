package pe.gob.inabif.sigrec.combustible.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateCombustibleRequest(@Valid @NotNull CombustibleDatos datos) {}
