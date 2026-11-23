package pe.gob.inabif.sigrec.servicio.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record HechoServicioRequest(@NotNull @Pattern(regexp = "interrupcion|restablecimiento|pago|correccion") String tipo,
        @NotNull LocalDate fecha, @Size(max = 1000) String detalle) {}
