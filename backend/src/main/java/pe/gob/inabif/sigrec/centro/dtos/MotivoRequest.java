package pe.gob.inabif.sigrec.centro.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

public record MotivoRequest(@NotBlank @Size(max = 500) String motivo) {}
