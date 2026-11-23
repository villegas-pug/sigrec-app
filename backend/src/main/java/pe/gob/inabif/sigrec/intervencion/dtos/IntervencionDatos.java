package pe.gob.inabif.sigrec.intervencion.dtos;
import java.time.YearMonth;
import jakarta.validation.constraints.*;

public record IntervencionDatos(@NotBlank @Size(max = 1000) String descripcion, YearMonth fecha, boolean esPintado) {}
