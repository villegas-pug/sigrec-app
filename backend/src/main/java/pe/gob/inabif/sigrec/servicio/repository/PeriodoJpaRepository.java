package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Periodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface PeriodoJpaRepository extends JpaRepository<Periodo, Long> {
    List<Periodo> findByServicioIdOrderByAnioAscNumeroAsc(Long servicioId);
    Optional<Periodo> findByServicioIdAndAnioAndMesesAndNumero(Long servicioId, int anio, int meses, int numero);
}
