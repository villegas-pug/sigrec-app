package pe.gob.inabif.sigrec.itinerario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateItinerarioRequest(@Valid @NotNull ItinerarioDatos datos) {}
