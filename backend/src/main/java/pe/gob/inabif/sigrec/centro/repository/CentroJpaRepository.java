package pe.gob.inabif.sigrec.centro.repository;

import pe.gob.inabif.sigrec.centro.model.Centro;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

@org.springframework.stereotype.Repository
public interface CentroJpaRepository extends JpaRepository<Centro, Long> {
    Optional<Centro> findByCodigo(String codigo);
    List<Centro> findByCodigoInOrderById(Collection<String> codigos);
    List<Centro> findAllByOrderById();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Centro c where c.codigo = :codigo")
    Optional<Centro> bloquear(@Param("codigo") String codigo);
}
