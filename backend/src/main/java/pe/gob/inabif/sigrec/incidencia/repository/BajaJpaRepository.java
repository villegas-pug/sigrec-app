package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Baja;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BajaJpaRepository extends JpaRepository<Baja, Long> {
    Optional<Baja> findByCodigo(String codigo);
    List<Baja> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<Baja> findByBienId(Long id);
}
