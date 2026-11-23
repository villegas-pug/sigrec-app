package pe.gob.inabif.sigrec.combustible.dtos;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CombustibleDatos(@NotNull @Pattern(regexp = "carga|consumo") String tipo, @NotNull LocalDate fecha,
        @NotNull @Positive @Digits(integer = 9, fraction = 3) BigDecimal cantidad,
        @Size(max = 40) String itinerarioId, @Size(max = 1000) String sustento) {}
