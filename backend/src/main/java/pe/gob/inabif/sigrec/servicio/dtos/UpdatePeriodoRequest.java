package pe.gob.inabif.sigrec.servicio.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdatePeriodoRequest(@NotNull @Pattern(regexp = "pagado|pendiente|sin_info") String estado,
        LocalDate vence, @Size(max = 500) String motivo, @Size(max = 1000) String detalle, @Valid Pago pago) {
    public record Pago(@NotNull LocalDate fecha, @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal importe,
                       @NotBlank @Size(max = 1000) String sustento) {}
}
