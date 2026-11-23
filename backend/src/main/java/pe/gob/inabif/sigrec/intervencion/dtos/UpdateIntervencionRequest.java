package pe.gob.inabif.sigrec.intervencion.dtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateIntervencionRequest(@NotNull @Valid IntervencionDatos datos) {}
