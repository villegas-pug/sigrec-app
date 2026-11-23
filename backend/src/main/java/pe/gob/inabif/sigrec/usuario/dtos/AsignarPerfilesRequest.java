package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record AsignarPerfilesRequest(@NotNull @Size(max = 100) List<@NotNull @Valid AsignacionUsuario> asignaciones) {}
