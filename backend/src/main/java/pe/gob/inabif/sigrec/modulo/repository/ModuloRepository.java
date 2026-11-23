package pe.gob.inabif.sigrec.modulo.repository;

import pe.gob.inabif.sigrec.modulo.model.Modulo;
import java.util.*;

public interface ModuloRepository {
    Optional<Modulo> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Modulo> findByCentroIdInOrderById(Collection<Long> centros);
    List<Modulo> findByCentroId(Long centro);
    Modulo save(Modulo modulo);
    void refresh(Modulo modulo);
}
