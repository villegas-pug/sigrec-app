package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.BienImplicado;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BienImplicadoRepositoryImpl implements BienImplicadoRepository {
    private final BienImplicadoJpaRepository jpaRepository;

    @Override
    public List<BienImplicado> findByIncidenteIdOrderById(Long id) {
        return jpaRepository.findByIncidenteIdOrderById(id);
    }

    @Override
    public List<BienImplicado> findByBajaIdOrderById(Long id) {
        return jpaRepository.findByBajaIdOrderById(id);
    }

    @Override
    public List<BienImplicado> findByReposicionIdOrderById(Long id) {
        return jpaRepository.findByReposicionIdOrderById(id);
    }

    @Override
    public List<BienImplicado> findByBienIdOrderById(Long id) {
        return jpaRepository.findByBienIdOrderById(id);
    }

    @Override
    public BienImplicado save(BienImplicado vinculo) {
        return jpaRepository.save(vinculo);
    }
}
