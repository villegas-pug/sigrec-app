package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.Bien;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BienRepositoryImpl implements BienRepository {
    private final BienJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Bien> findByRotulo(String rotulo) {
        return jpaRepository.findByRotulo(rotulo);
    }

    @Override
    public List<Bien> findByAmbienteModuloCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByAmbienteModuloCentroCodigoInOrderById(centros);
    }

    @Override
    public List<Bien> findByPrincipalIdOrderById(Long id) {
        return jpaRepository.findByPrincipalIdOrderById(id);
    }

    @Override
    public List<Bien> findByTipoId(Long id) { return jpaRepository.findByTipoId(id); }

    @Override
    public List<Bien> findByAmbienteId(Long id) {
        return jpaRepository.findByAmbienteId(id);
    }

    @Override
    public Bien save(Bien bien) {
        return jpaRepository.save(bien);
    }

    @Override
    public void refresh(Bien bien) {
        entityManager.refresh(bien);
    }
}
