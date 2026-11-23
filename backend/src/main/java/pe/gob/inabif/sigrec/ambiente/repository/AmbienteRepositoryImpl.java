package pe.gob.inabif.sigrec.ambiente.repository;

import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AmbienteRepositoryImpl implements AmbienteRepository {
    private final AmbienteJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Ambiente> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public boolean existsByCodigo(String codigo) {
        return jpaRepository.existsByCodigo(codigo);
    }

    @Override
    public List<Ambiente> findByModuloIdInOrderById(Collection<Long> modulos) {
        return jpaRepository.findByModuloIdInOrderById(modulos);
    }

    @Override
    public List<Ambiente> findByModuloId(Long modulo) {
        return jpaRepository.findByModuloId(modulo);
    }

    @Override
    public Ambiente save(Ambiente ambiente) {
        return jpaRepository.save(ambiente);
    }

    @Override
    public void refresh(Ambiente ambiente) {
        entityManager.refresh(ambiente);
    }
}
