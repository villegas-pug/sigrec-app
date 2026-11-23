package pe.gob.inabif.sigrec.incidencia.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateIncidenciaRequest(@Valid @NotNull IncidenciaDatos datos, boolean novedad) {}
