package pe.gob.inabif.sigrec.centro.repository;

import pe.gob.inabif.sigrec.centro.model.Centro;
import java.util.*;

public interface CentroRepository {
    Optional<Centro> findByCodigo(String codigo);
    List<Centro> findByCodigoInOrderById(Collection<String> codigos);
    List<Centro> findAllByOrderById();
    Optional<Centro> bloquear(String codigo);
    Centro save(Centro centro);
}
