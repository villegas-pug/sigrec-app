package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.HistorialBien;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface HistorialBienRepository {
    Optional<HistorialBien> findByCodigo(String codigo);
    List<HistorialBien> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<HistorialBien> findByBienId(Long id);
    HistorialBien save(HistorialBien hecho);
}
