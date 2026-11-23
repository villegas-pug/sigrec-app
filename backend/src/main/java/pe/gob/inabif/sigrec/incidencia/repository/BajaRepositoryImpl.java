package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Baja;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BajaRepositoryImpl implements BajaRepository {
    private final BajaJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Baja> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<Baja> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByBienAmbienteModuloCentroCodigoInOrderById(centros);
    }

    @Override
    public List<Baja> findByBienId(Long id) {
        return jpaRepository.findByBienId(id);
    }

    @Override
    public Baja save(Baja baja) {
        return jpaRepository.save(baja);
    }

    @Override
    public void refresh(Baja baja) {
        entityManager.refresh(baja);
    }
}
