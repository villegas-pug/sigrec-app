package pe.gob.inabif.sigrec.itinerario.repository;

import java.util.*;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ItinerarioRepositoryImpl implements ItinerarioRepository {
    private final ItinerarioJpaRepository jpaRepository;

    @Override
    public Optional<Itinerario> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Itinerario> findByVehiculoIdInOrderById(Collection<Long> ids) { return jpaRepository.findByVehiculoIdInOrderById(ids); }

    @Override
    public Optional<String> vehiculoDe(String codigo) { return jpaRepository.vehiculoDe(codigo); }

    @Override
    public Itinerario save(Itinerario registro) { return jpaRepository.save(registro); }
}
