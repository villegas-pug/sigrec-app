package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.HechoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface HechoServicioJpaRepository extends JpaRepository<HechoServicio, Long> {
    Optional<HechoServicio> findByCodigo(String codigo);
    @Query("select h from HechoServicio h left join h.periodo p left join h.servicio s where s.id = :servicioId or p.servicio.id = :servicioId order by h.id")
    List<HechoServicio> listarPorServicio(Long servicioId);
}
