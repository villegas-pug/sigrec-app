package pe.gob.inabif.sigrec.itinerario.repository;

import java.util.*;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;

public interface ItinerarioRepository {
    Optional<Itinerario> findByCodigo(String codigo);
    List<Itinerario> findByVehiculoIdInOrderById(Collection<Long> ids);
    Optional<String> vehiculoDe(String codigo);
    Itinerario save(Itinerario registro);
}
