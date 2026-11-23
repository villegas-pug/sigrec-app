package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.HechoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class HechoServicioRepositoryImpl implements HechoServicioRepository {
    private final HechoServicioJpaRepository jpaRepository;

    @Override
    public Optional<HechoServicio> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<HechoServicio> listarPorServicio(Long servicioId) { return jpaRepository.listarPorServicio(servicioId); }

    @Override
    public HechoServicio save(HechoServicio registro) { return jpaRepository.save(registro); }
}
