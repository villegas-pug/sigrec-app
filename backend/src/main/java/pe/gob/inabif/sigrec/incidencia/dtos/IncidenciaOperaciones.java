package pe.gob.inabif.sigrec.incidencia.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

public final class IncidenciaOperaciones {
    private IncidenciaOperaciones() {}
    public record Atender(@Size(max = 1000) String detalle, LocalDate fecha) {}
    public record Baja(@NotBlank @Size(max = 500) String motivo, @Size(max = 1000) String detalle, LocalDate fecha) {}
    public record Reponer(@NotBlank @Size(max = 80) String rotulo, @NotBlank @Size(max = 180) String nombre,
                         @Size(max = 80) String codigoPatrimonial, @Pattern(regexp = "\\d{4}(-\\d{2})?") String fechaAdquisicion,
                         @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal costo,
                         @Min(1) @Max(9999) Integer vidaUtilAnios, LocalDate fecha,
                         @Size(max = 500) List<@NotBlank String> componentesIds) {}
}
