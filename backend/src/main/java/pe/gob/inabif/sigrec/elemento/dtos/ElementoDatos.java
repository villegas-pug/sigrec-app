package pe.gob.inabif.sigrec.elemento.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public record ElementoDatos() {
    public record Adicional(@NotBlank @Size(max = 80) String key, @NotBlank @Size(max = 40) String label,
                            @NotBlank @Size(max = 60) @Pattern(regexp = "[a-z0-9_]+") String icono) {}
}
