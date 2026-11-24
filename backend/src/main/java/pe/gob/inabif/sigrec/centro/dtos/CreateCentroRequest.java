package pe.gob.inabif.sigrec.centro.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateCentroRequest(@NotBlank @Pattern(regexp = "[A-Z]{3}") String id,
                       @NotBlank @Size(max = 180) String nombre, @NotNull @Valid CentroDatos.InmuebleInput inmueble,
                       @NotNull(message = "Seleccione una unidad orgánica.") @Digits(integer = 11, fraction = 0)
                       Long unidadOrganicaId) {}
