package pe.gob.inabif.sigrec.incidencia.repository;

import pe.gob.inabif.sigrec.incidencia.model.Atencion;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class AtencionRepositoryImpl implements AtencionRepository {
    private final AtencionJpaRepository jpaRepository;

    @Override
    public List<Atencion> findByIncidenteIdOrderById(Long id) {
        return jpaRepository.findByIncidenteIdOrderById(id);
    }

    @Override
    public Atencion save(Atencion atencion) {
        return jpaRepository.save(atencion);
    }
}
