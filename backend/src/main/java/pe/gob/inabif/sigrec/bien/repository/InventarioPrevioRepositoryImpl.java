package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.InventarioPrevio;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class InventarioPrevioRepositoryImpl implements InventarioPrevioRepository {
    private final InventarioPrevioJpaRepository jpaRepository;

    @Override
    public Optional<InventarioPrevio> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<InventarioPrevio> findByCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByCentroCodigoInOrderById(centros);
    }

    @Override
    public InventarioPrevio save(InventarioPrevio dato) {
        return jpaRepository.save(dato);
    }
}
