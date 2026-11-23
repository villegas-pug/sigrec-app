package pe.gob.inabif.sigrec.auth.dtos;

import jakarta.validation.constraints.*;

public record CreateAuthRequest(@NotBlank @Size(max = 250) String usuario, @NotBlank @Size(max = 72) String password) {}
