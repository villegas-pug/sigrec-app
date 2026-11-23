package pe.gob.inabif.sigrec.ambiente.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;

public record CreateAmbienteRequest(@NotBlank String moduloId, @NotBlank @Size(max = 180) String nombre,
                         @Min(0) @Max(999) Integer piso, @Size(max = 80) String bloque, @Size(max = 1000) String ubicacion,
                         @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal areaM2,
                         @Min(0) @Max(999999) Integer puertas, @Min(0) @Max(999999) Integer ventanas,
                         @NotBlank String condicion, YearMonth ultimoPintado,
                         @Size(max = 100) Map<String, String> estadoElementos) {}
