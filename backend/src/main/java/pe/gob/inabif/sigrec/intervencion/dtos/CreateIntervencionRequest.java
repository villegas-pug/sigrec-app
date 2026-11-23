package pe.gob.inabif.sigrec.intervencion.dtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateIntervencionRequest(@NotBlank @Size(max = 40) String ambienteId,
                                        @NotNull @Valid IntervencionDatos datos) {}
