package pe.gob.inabif.sigrec.mantenimiento.repository;

import java.util.*;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MantenimientoRepositoryImpl implements MantenimientoRepository {
    private final MantenimientoJpaRepository jpaRepository;

    @Override
    public Optional<Mantenimiento> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Mantenimiento> findAllByOrderById() { return jpaRepository.findAllByOrderById(); }

    @Override
    public List<Mantenimiento> listarAmbito(Collection<String> centros, Collection<Long> vehiculos) { return jpaRepository.listarAmbito(centros, vehiculos); }

    @Override
    public Mantenimiento save(Mantenimiento registro) { return jpaRepository.save(registro); }
}
