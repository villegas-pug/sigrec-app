package pe.gob.inabif.sigrec.modulo.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;

public record CreateModuloRequest(@NotBlank String carId, @NotBlank @Size(max = 180) String nombre, @NotNull @Pattern(regexp = "casa|comun") String tipo,
                       @Min(1) @Max(99999999) Integer capacidad, @NotNull @Min(1) @Max(999) Integer pisos,
                       @DecimalMin(value = "0", inclusive = false) @Digits(integer = 10, fraction = 2) BigDecimal areaM2,
                       @NotBlank String condicion, @Size(max = 1000) String ubicacion,
                       @Size(max = 100) Map<String, String> estadoElementos,
                       @Size(max = 100) List<@NotNull @Valid Adicional> elementosAdicionales) {}
