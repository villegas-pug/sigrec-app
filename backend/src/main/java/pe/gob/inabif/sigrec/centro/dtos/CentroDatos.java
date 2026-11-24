package pe.gob.inabif.sigrec.centro.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;

public record CentroDatos(@Pattern(regexp = "[A-Z0-9]{3}") String id,
                       @NotBlank @Size(max = 180) String nombre, @NotNull @Valid InmuebleInput inmueble) {
    public record InmuebleInput(@Size(max = 250) String direccion, @Valid Fundacion fundacion,
                         @NotNull @Pattern(regexp = "propio|alquilado") String condicion,
                         @Size(max = 180) String arrendador, LocalDate contratoHasta,
                         @Size(max = 1000) String litigios, @Valid Seguridad seguridad, @Valid ConstruccionInput construccion) {}

    public record Fundacion(@Size(max = 180) String referencia, @Size(max = 1000) String nota) {}

    public record Seguridad(@Min(0) @Max(99999999) Integer extintoresRequeridos) {}

    public record ConstruccionInput(@Size(max = 180) String material, @Size(max = 100) String antiguedad,
                             @Size(max = 1000) String antiguedadNota, @Min(1) @Max(999) Integer pisos,
                             @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal areaM2,
                             @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal areaTerrenoM2,
                             String estado, @Size(max = 1000) String caracteristicas,
                             @Size(max = 100) Map<String, String> estadoElementos,
                             @Size(max = 100) List<@NotNull @Valid Adicional> elementosAdicionales) {}
}
