package pe.gob.inabif.sigrec.intervencion.repository;

import java.util.*;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class IntervencionRepositoryImpl implements IntervencionRepository {
    private final IntervencionJpaRepository jpaRepository;

    @Override
    public Optional<Intervencion> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Intervencion> findAllByOrderById() { return jpaRepository.findAllByOrderById(); }

    @Override
    public List<Intervencion> findByAmbienteModuloCentroCodigoInOrderById(Collection<String> centros) { return jpaRepository.findByAmbienteModuloCentroCodigoInOrderById(centros); }

    @Override
    public Intervencion save(Intervencion registro) { return jpaRepository.save(registro); }
}
