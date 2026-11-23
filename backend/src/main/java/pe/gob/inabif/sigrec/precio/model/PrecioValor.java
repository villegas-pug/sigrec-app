package pe.gob.inabif.sigrec.precio.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PrecioValor(BigDecimal precio, LocalDate fechaPrecio, String procedencia) {}
