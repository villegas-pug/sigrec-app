package pe.gob.inabif.sigrec.mantenimiento.dtos;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MantenimientoDatos(@NotNull LocalDate fecha, LocalDate proxima, @Size(max = 1000) String detalle,
                                 @Positive @Digits(integer = 12, fraction = 2) BigDecimal importe) {}
