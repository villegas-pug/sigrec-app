package pe.gob.inabif.sigrec.bien.dtos;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public final class BienOperaciones {
    private BienOperaciones() {}
    public record Verificacion(@NotBlank @Pattern(regexp = "coincide|diferencias") String resultado,
                               @Size(max = 1000) String nota, LocalDate fecha) {}
    public record LoteVerificacion(@NotBlank @Size(max = 40) String ambienteId,
            @NotEmpty @Size(max = 500) java.util.Map<@NotBlank String, @NotNull @jakarta.validation.Valid Verificacion> registros) {}
    public record Asociacion(@Size(max = 80) String padreId, @Size(max = 180) String posicion) {}
    public record Traslado(@NotBlank @Size(max = 40) String ambienteId, LocalDate fecha) {}
}
