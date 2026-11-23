package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record AsignacionUsuario(@NotBlank @Size(max = 40) String perfil, @Size(max = 3) String centro, @Size(max = 40) String vehiculo) {}
