package pe.gob.inabif.sigrec.bien.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateBienRequest(@NotNull @Valid BienDatos bien,
                               @Size(max = 40) String inventarioPrevioId,
                               @Valid BienOperaciones.Verificacion verificacion) {}
