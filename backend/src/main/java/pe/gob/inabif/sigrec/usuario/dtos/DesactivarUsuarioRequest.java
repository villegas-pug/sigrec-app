package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record DesactivarUsuarioRequest(@NotBlank @Size(max = 500) String motivo) {}
