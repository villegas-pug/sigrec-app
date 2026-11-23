package pe.gob.inabif.sigrec.catalogo.dtos;

import jakarta.validation.constraints.*;

public record TipoBienRequest(@NotBlank @Size(max = 180) String nombre, @NotBlank @Size(max = 40) String categoria,
                              @Min(1) @Max(9999) Integer vidaUtilSugerida) {}
