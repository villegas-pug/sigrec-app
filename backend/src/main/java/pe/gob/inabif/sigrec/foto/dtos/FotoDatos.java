package pe.gob.inabif.sigrec.foto.dtos;
import jakarta.validation.constraints.*;

public record FotoDatos(@NotBlank @Size(max = 180) String titulo, @Size(max = 1000) String nota,
                        @Size(max = 40) String ambienteId) {}
