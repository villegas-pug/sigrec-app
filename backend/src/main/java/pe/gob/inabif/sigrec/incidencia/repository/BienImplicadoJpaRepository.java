package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.BienImplicado;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BienImplicadoJpaRepository extends JpaRepository<BienImplicado, Long> {
    List<BienImplicado> findByIncidenteIdOrderById(Long id);
    List<BienImplicado> findByBajaIdOrderById(Long id);
    List<BienImplicado> findByReposicionIdOrderById(Long id);
    List<BienImplicado> findByBienIdOrderById(Long id);
}
