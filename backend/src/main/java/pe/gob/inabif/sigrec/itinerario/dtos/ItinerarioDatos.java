package pe.gob.inabif.sigrec.itinerario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ItinerarioDatos(@NotNull LocalDate fecha, @NotBlank @Size(max = 500) String proposito,
        @NotEmpty @Size(max = 200) List<@NotBlank @Size(max = 300) String> destinos,
        @Valid Tramo previsto, @Valid Tramo realizado, @Valid Ruta ruta) {
    public record Tramo(@Pattern(regexp = HORA) String salida, @Pattern(regexp = HORA) String llegada,
                        @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal km) {
        private static final String HORA = "([01][0-9]|2[0-3]):[0-5][0-9]";
    }
    public record Punto(@NotBlank @Size(max = 300) String nombre, @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
                        @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng) {}
    public record Geometria(@NotNull @Pattern(regexp = "LineString") String type,
                           @NotNull @Size(min = 2, max = 30000) List<@NotNull @Size(min = 2, max = 2) List<@NotNull Double>> coordinates) {}
    public record Ruta(@NotBlank @Size(max = 60) String proveedor, @NotNull @PositiveOrZero BigDecimal distanciaM,
                      @NotNull @Size(min = 2, max = 200) List<@Valid @NotNull Punto> puntos, @Valid @NotNull Geometria geometry) {}
}
