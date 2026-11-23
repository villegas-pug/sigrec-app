package pe.gob.inabif.sigrec.modulo.repository;

import pe.gob.inabif.sigrec.modulo.model.Modulo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

@org.springframework.stereotype.Repository
public interface ModuloJpaRepository extends JpaRepository<Modulo, Long> {
    Optional<Modulo> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Modulo> findByCentroIdInOrderById(Collection<Long> centros);
    List<Modulo> findByCentroId(Long centro);
}
