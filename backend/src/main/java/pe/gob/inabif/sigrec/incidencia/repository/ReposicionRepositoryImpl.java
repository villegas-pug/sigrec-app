package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Reposicion;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ReposicionRepositoryImpl implements ReposicionRepository {
    private final ReposicionJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Reposicion> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<Reposicion> findByBajaBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByBajaBienAmbienteModuloCentroCodigoInOrderById(centros);
    }

    @Override
    public List<Reposicion> findByBajaId(Long id) {
        return jpaRepository.findByBajaId(id);
    }

    @Override
    public Reposicion save(Reposicion reposicion) {
        return jpaRepository.save(reposicion);
    }

    @Override
    public void refresh(Reposicion reposicion) {
        entityManager.refresh(reposicion);
    }
}
