package pe.gob.inabif.sigrec.itinerario.repository;

import java.util.*;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface ItinerarioJpaRepository extends JpaRepository<Itinerario, Long> {
    Optional<Itinerario> findByCodigo(String codigo);
    List<Itinerario> findByVehiculoIdInOrderById(Collection<Long> ids);
    @Query("select i.vehiculo.codigo from Itinerario i where i.codigo = :codigo")
    Optional<String> vehiculoDe(String codigo);
}
