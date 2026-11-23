package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Baja;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface BajaRepository {
    Optional<Baja> findByCodigo(String codigo);
    List<Baja> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<Baja> findByBienId(Long id);
    Baja save(Baja baja);
    void refresh(Baja baja);
}
