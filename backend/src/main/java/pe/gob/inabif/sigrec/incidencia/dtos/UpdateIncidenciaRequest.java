package pe.gob.inabif.sigrec.incidencia.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateIncidenciaRequest(@Valid @NotNull IncidenciaDatos datos) {}
