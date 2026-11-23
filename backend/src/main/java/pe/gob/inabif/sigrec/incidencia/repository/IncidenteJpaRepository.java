package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Incidente;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidenteJpaRepository extends JpaRepository<Incidente, Long> {
    Optional<Incidente> findByCodigo(String codigo);
    List<Incidente> findByCentroCodigoInOrderById(Collection<String> centros);
}
