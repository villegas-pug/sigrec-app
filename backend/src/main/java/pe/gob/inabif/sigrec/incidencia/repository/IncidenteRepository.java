package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Incidente;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface IncidenteRepository {
    Optional<Incidente> findByCodigo(String codigo);
    List<Incidente> findByCentroCodigoInOrderById(Collection<String> centros);
    Incidente save(Incidente hecho);
    void refresh(Incidente hecho);
}
