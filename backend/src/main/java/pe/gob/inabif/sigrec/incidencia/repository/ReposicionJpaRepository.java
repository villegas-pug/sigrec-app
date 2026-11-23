package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Reposicion;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReposicionJpaRepository extends JpaRepository<Reposicion, Long> {
    Optional<Reposicion> findByCodigo(String codigo);
    List<Reposicion> findByBajaBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<Reposicion> findByBajaId(Long id);
}
