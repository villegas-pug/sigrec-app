package pe.gob.inabif.sigrec.itinerario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateItinerarioRequest(@NotBlank @Size(max = 40) String vehiculoId,
        @Valid @NotNull ItinerarioDatos datos) {}
