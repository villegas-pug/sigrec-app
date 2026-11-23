package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Atencion;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AtencionJpaRepository extends JpaRepository<Atencion, Long> {
    List<Atencion> findByIncidenteIdOrderById(Long id);
}
