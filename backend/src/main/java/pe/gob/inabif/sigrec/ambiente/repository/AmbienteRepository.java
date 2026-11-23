package pe.gob.inabif.sigrec.ambiente.repository;

import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import java.util.*;

public interface AmbienteRepository {
    Optional<Ambiente> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Ambiente> findByModuloIdInOrderById(Collection<Long> modulos);
    List<Ambiente> findByModuloId(Long modulo);
    Ambiente save(Ambiente ambiente);
    void refresh(Ambiente ambiente);
}
