package pe.gob.inabif.sigrec.centro.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public record CreateCentroRequest(@NotBlank @Pattern(regexp = "[A-Z]{3}") String id,
                       @NotBlank @Size(max = 180) String nombre, @NotNull @Valid CentroDatos.InmuebleInput inmueble) {}
