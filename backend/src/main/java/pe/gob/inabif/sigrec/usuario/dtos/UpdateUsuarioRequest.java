package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record UpdateUsuarioRequest(@NotBlank @Size(max = 180) String nombre) {}
