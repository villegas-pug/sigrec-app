package pe.gob.inabif.sigrec.intervencion.repository;

import java.util.*;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface IntervencionJpaRepository extends JpaRepository<Intervencion, Long> {
    Optional<Intervencion> findByCodigo(String codigo);
    List<Intervencion> findAllByOrderById();
    List<Intervencion> findByAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
}
