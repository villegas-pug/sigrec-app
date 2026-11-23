package pe.gob.inabif.sigrec.centro.repository;

import pe.gob.inabif.sigrec.centro.model.Centro;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CentroRepositoryImpl implements CentroRepository {
    private final CentroJpaRepository jpaRepository;

    @Override
    public Optional<Centro> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<Centro> findByCodigoInOrderById(Collection<String> codigos) {
        return jpaRepository.findByCodigoInOrderById(codigos);
    }

    @Override
    public List<Centro> findAllByOrderById() {
        return jpaRepository.findAllByOrderById();
    }

    @Override
    public Optional<Centro> bloquear(String codigo) {
        return jpaRepository.bloquear(codigo);
    }

    @Override
    public Centro save(Centro centro) {
        return jpaRepository.save(centro);
    }
}
