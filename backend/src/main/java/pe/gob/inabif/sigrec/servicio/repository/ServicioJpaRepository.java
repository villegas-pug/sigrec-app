package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface ServicioJpaRepository extends JpaRepository<Servicio, Long> {
    Optional<Servicio> findByCodigo(String codigo);
    List<Servicio> findByCentroCodigoInOrderById(Collection<String> centros);
    List<Servicio> findAllByOrderById();
    @Query("select s.centro.codigo from Servicio s where s.codigo = :codigo")
    Optional<String> centroDe(String codigo);
    boolean existsByCodigo(String codigo);
    boolean existsByCentroIdAndTipoIdAndEstadoAndEliminado(Long centroId, Long tipoId, int estado, int eliminado);
    boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado);
}
