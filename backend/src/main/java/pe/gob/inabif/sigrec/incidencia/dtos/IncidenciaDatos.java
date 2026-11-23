package pe.gob.inabif.sigrec.incidencia.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record IncidenciaDatos(@NotNull @Valid Origen origen, @NotBlank @Size(max = 40) String tipo,
                              @NotBlank @Size(max = 180) String titulo, LocalDate fecha,
                              @Size(max = 1000) String detalle, @Size(max = 1000) String ubicacion,
                              boolean requiereEvaluacion, @Size(max = 500) List<@NotBlank String> bienIds,
                              @Size(max = 500) Map<String, @NotNull @Valid Evaluacion> evaluaciones,
                              @Size(max = 500) Map<String,String> condiciones) {
    public record Origen(@NotBlank @Pattern(regexp = "centro|ambiente|bien|componente") String tipo,
                         @NotBlank @Size(max = 80) String id) {}
    public record Evaluacion(@NotNull Boolean requiereReposicion, @NotNull @Positive Integer unidades) {}
}
