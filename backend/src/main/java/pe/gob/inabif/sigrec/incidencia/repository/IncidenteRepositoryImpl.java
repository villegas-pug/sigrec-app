package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Incidente;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class IncidenteRepositoryImpl implements IncidenteRepository {
    private final IncidenteJpaRepository jpaRepository;
    private final jakarta.persistence.EntityManager entityManager;

    @Override
    public Optional<Incidente> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<Incidente> findByCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByCentroCodigoInOrderById(centros);
    }

    @Override
    public Incidente save(Incidente hecho) {
        return jpaRepository.save(hecho);
    }

    @Override
    public void refresh(Incidente hecho) {
        entityManager.refresh(hecho);
    }
}
