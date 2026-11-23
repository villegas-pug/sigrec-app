package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.InventarioPrevio;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventarioPrevioJpaRepository extends JpaRepository<InventarioPrevio, Long> {
    Optional<InventarioPrevio> findByCodigo(String codigo);
    List<InventarioPrevio> findByCentroCodigoInOrderById(Collection<String> centros);
}
