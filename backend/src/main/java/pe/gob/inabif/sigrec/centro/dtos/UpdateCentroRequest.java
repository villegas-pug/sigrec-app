package pe.gob.inabif.sigrec.centro.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record UpdateCentroRequest(
                       @NotBlank @Size(max = 180) String nombre, @NotNull @Valid CentroDatos.InmuebleInput inmueble,
                       @Digits(integer = 11, fraction = 0) Long unidadOrganicaId) {}
