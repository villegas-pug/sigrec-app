package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Periodo;

public interface PeriodoRepository {
    List<Periodo> findByServicioIdOrderByAnioAscNumeroAsc(Long servicioId);
    Optional<Periodo> findByServicioIdAndAnioAndMesesAndNumero(Long servicioId, int anio, int meses, int numero);
    Periodo save(Periodo registro);
}
