package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.InventarioPrevio;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface InventarioPrevioRepository {
    Optional<InventarioPrevio> findByCodigo(String codigo);
    List<InventarioPrevio> findByCentroCodigoInOrderById(Collection<String> centros);
    InventarioPrevio save(InventarioPrevio dato);
}
