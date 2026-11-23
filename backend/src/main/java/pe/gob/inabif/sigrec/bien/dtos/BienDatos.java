package pe.gob.inabif.sigrec.bien.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record BienDatos(
        @NotBlank @Size(max = 80) String id,
        @NotBlank @Size(max = 40) String ambienteId,
        @NotBlank @Size(max = 40) String tipoId,
        @NotBlank @Size(max = 180) String nombre,
        @NotBlank @Size(max = 40) String categoria,
        @Size(max = 80) String codigoPatrimonial,
        @Size(max = 180) String marcaModelo,
        @Size(max = 120) String serie,
        @Size(max = 1000) String descripcion,
        @Size(max = 40) String condicion,
        @Size(max = 1000) String deterioro,
        @Valid Adquisicion adquisicion,
        @Min(1) @Max(9999) Integer vidaUtilAnios,
        @NotNull @Positive Integer cantidad,
        @Valid Asociacion asociadoA) {
    public record Adquisicion(@Pattern(regexp = "\\d{4}(-\\d{2})?") String fecha,
                             @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal costo) {}
    public record Asociacion(@NotBlank @Size(max = 80) String bienId, @Size(max = 180) String posicion) {}
}
