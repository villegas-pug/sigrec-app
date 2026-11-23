package pe.gob.inabif.sigrec.servicio.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ServicioDatos(
        @NotBlank @Size(max = 180) String proveedor,
        @Valid Contacto contacto,
        @Size(max = 100) String suministro,
        @Size(max = 1000) String contratacion,
        @Pattern(regexp = "\\d{4}(-\\d{2})?") String inicio,
        @Valid Renovacion renovacion,
        @Size(max = 1000) String observaciones) {
    public record Contacto(@Size(max = 40) String telefono, @Size(max = 180) String nombre) {}
    public record Renovacion(@NotNull LocalDate fecha, @Size(max = 1000) String detalle) {}
}
