package pe.gob.inabif.sigrec.precio.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PrecioResponse(String tipoId, BigDecimal precio, String fechaPrecio, String procedencia,
                             List<Historico> historial) {
    public record Historico(BigDecimal precio, String fechaPrecio, String procedencia,
                            LocalDate reemplazadoEl, String por) {}
}
