package pe.gob.inabif.sigrec.combustible.repository;

import java.util.*;
import pe.gob.inabif.sigrec.combustible.model.Combustible;

public interface CombustibleRepository {
    Optional<Combustible> findByCodigo(String codigo);
    Optional<Combustible> findByItinerarioIdAndEstadoAndEliminado(Long id, int estado, int eliminado);
    List<Combustible> listarAmbito(Collection<Long> ids);
    Optional<String> vehiculoDe(String codigo);
    Combustible save(Combustible registro);
}
