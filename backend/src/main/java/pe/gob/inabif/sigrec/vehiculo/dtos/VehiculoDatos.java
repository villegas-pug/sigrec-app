package pe.gob.inabif.sigrec.vehiculo.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record VehiculoDatos(
        @NotBlank @Size(max = 100) String tipo,
        @NotBlank @Size(max = 20) String placa,
        @Size(max = 180) String chofer,
        @NotBlank @Size(max = 100) String combustible,
        @PositiveOrZero @Digits(integer = 7, fraction = 3) BigDecimal rendimientoKmL,
        @Pattern(regexp = "operativo|requiereMantenimiento|detenido") String estadoOperativo,
        @Valid Mantenimiento mantenimiento) {
    public record Mantenimiento(@Size(max = 1000) String motivo,
                               @Positive @Digits(integer = 12, fraction = 2) BigDecimal presupuestoEstimado) {}
}
