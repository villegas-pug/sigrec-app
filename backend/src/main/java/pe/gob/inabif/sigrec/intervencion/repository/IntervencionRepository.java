package pe.gob.inabif.sigrec.intervencion.repository;

import java.util.*;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;

public interface IntervencionRepository {
    Optional<Intervencion> findByCodigo(String codigo);
    List<Intervencion> findAllByOrderById();
    List<Intervencion> findByAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    Intervencion save(Intervencion registro);
}
