package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.HistorialBien;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HistorialBienJpaRepository extends JpaRepository<HistorialBien, Long> {
    Optional<HistorialBien> findByCodigo(String codigo);
    List<HistorialBien> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<HistorialBien> findByBienId(Long id);
}
