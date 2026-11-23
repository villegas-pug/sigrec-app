package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CreateUsuarioRequest(@NotBlank @Pattern(regexp = "[A-Za-z0-9_.-]{3,40}") String usuario, @NotBlank @Size(max = 180) String nombre,
                @NotBlank @Size(max = 72) String password) {}
