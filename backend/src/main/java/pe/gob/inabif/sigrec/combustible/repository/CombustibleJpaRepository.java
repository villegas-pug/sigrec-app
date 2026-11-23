package pe.gob.inabif.sigrec.combustible.repository;

import java.util.*;
import pe.gob.inabif.sigrec.combustible.model.Combustible;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface CombustibleJpaRepository extends JpaRepository<Combustible, Long> {
    Optional<Combustible> findByCodigo(String codigo);
    Optional<Combustible> findByItinerarioIdAndEstadoAndEliminado(Long id, int estado, int eliminado);
    @Query("select c from Combustible c left join c.itinerario i where c.vehiculo.id in :ids or i.vehiculo.id in :ids order by c.id")
    List<Combustible> listarAmbito(Collection<Long> ids);
    @Query("select coalesce(v.codigo, iv.codigo) from Combustible c left join c.vehiculo v left join c.itinerario i left join i.vehiculo iv where c.codigo = :codigo")
    Optional<String> vehiculoDe(String codigo);
}
