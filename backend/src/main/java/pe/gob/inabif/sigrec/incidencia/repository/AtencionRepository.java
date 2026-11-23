package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Atencion;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface AtencionRepository {
    List<Atencion> findByIncidenteIdOrderById(Long id);
    Atencion save(Atencion atencion);
}
