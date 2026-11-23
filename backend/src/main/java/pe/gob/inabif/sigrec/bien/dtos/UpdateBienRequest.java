package pe.gob.inabif.sigrec.bien.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateBienRequest(@NotNull @Valid BienDatos bien) {}
