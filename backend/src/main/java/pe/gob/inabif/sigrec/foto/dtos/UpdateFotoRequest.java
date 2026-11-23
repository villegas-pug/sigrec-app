package pe.gob.inabif.sigrec.foto.dtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateFotoRequest(@NotNull @Valid FotoDatos datos) {}
