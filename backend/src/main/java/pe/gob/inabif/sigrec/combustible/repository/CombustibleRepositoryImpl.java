package pe.gob.inabif.sigrec.combustible.repository;

import java.util.*;
import pe.gob.inabif.sigrec.combustible.model.Combustible;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CombustibleRepositoryImpl implements CombustibleRepository {
    private final CombustibleJpaRepository jpaRepository;

    @Override
    public Optional<Combustible> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public Optional<Combustible> findByItinerarioIdAndEstadoAndEliminado(Long id, int estado, int eliminado) { return jpaRepository.findByItinerarioIdAndEstadoAndEliminado(id, estado, eliminado); }

    @Override
    public List<Combustible> listarAmbito(Collection<Long> ids) { return jpaRepository.listarAmbito(ids); }

    @Override
    public Optional<String> vehiculoDe(String codigo) { return jpaRepository.vehiculoDe(codigo); }

    @Override
    public Combustible save(Combustible registro) { return jpaRepository.save(registro); }
}
