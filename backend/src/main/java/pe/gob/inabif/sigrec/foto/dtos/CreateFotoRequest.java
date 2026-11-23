package pe.gob.inabif.sigrec.foto.dtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateFotoRequest(@Size(max = 40) String carId, @Size(max = 80) String bienId,
                                @NotNull @Valid FotoDatos datos) {}
