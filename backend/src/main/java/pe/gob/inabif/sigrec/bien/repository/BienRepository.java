package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.Bien;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface BienRepository {
    Optional<Bien> findByRotulo(String rotulo);
    List<Bien> findByAmbienteModuloCentroCodigoInOrderById(Collection<String> centros);
    List<Bien> findByPrincipalIdOrderById(Long id);
    List<Bien> findByTipoId(Long id);
    List<Bien> findByAmbienteId(Long id);
    Bien save(Bien bien);
    void refresh(Bien bien);
}
