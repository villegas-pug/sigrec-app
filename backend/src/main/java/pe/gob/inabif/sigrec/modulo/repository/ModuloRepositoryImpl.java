package pe.gob.inabif.sigrec.modulo.repository;

import pe.gob.inabif.sigrec.modulo.model.Modulo;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ModuloRepositoryImpl implements ModuloRepository {
    private final ModuloJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Modulo> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public boolean existsByCodigo(String codigo) {
        return jpaRepository.existsByCodigo(codigo);
    }

    @Override
    public List<Modulo> findByCentroIdInOrderById(Collection<Long> centros) {
        return jpaRepository.findByCentroIdInOrderById(centros);
    }

    @Override
    public List<Modulo> findByCentroId(Long centro) {
        return jpaRepository.findByCentroId(centro);
    }

    @Override
    public Modulo save(Modulo modulo) {
        return jpaRepository.save(modulo);
    }

    @Override
    public void refresh(Modulo modulo) {
        entityManager.refresh(modulo);
    }
}
