package pe.gob.inabif.sigrec.precio.repository;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import pe.gob.inabif.sigrec.precio.model.Precio;

@Repository
@RequiredArgsConstructor
public class PrecioRepositoryImpl implements PrecioRepository {
    private final PrecioJpaRepository jpaRepository;

    @Override
    public List<Precio> listarActuales() { return jpaRepository.listarActuales(); }

    @Override
    public List<Precio> listarConHistorial() { return jpaRepository.listarConHistorial(); }

    @Override
    public List<Precio> listarPorTipo(Long tipoId) { return jpaRepository.listarPorTipo(tipoId); }

    @Override
    public Optional<Precio> buscarActual(Long tipoId) { return jpaRepository.buscarActual(tipoId); }

    @Override
    public boolean existsByTipoId(Long tipoId) { return jpaRepository.existsByTipoId(tipoId); }

    @Override
    public Precio save(Precio precio) { return jpaRepository.save(precio); }

    @Override
    public void flush() { jpaRepository.flush(); }
}
