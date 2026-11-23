package pe.gob.inabif.sigrec.precio.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.YearMonth;

public record UpdatePrecioRequest(
        @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 12, fraction = 2) BigDecimal precio,
        YearMonth fechaPrecio,
        @Size(max = 1000) String procedencia) {}
