package pe.gob.inabif.sigrec.combustible.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateCombustibleRequest(@NotBlank @Size(max = 40) String vehiculoId,
        @Valid @NotNull CombustibleDatos datos) {}
