package pe.gob.inabif.sigrec.centro.service;

import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;

/**
 * SPEC 052: arma el filtro de cabecera de una colección. Con {@code registro=CENTRO} (Gestión de centros) el periodo
 * se aplica a la fecha de registro del centro dueño: se traduce en los centros registrados en el periodo, para que
 * todas las colecciones de la pantalla queden acotadas a los mismos centros que la jerarquía.
 */
@Component
@RequiredArgsConstructor
public class FiltroCentros {
    public static final String REGISTRO_CENTRO = "CENTRO";
    private final CentroRepository centros;

    @Transactional(readOnly = true)
    public FiltroConsulta filtro(String centro, Integer anio, Integer mes, String registro) {
        var filtro = new FiltroConsulta(centro, anio, mes);
        if (!REGISTRO_CENTRO.equals(registro) || !filtro.porPeriodo()) return filtro;
        return filtro.soloCentros(centros.findAllByOrderById().stream()
                .filter(c -> filtro.incluye(c.fechaRegistro())).map(Centro::codigo).filter(Objects::nonNull)
                .collect(Collectors.toSet()));
    }
}
