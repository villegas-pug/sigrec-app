package pe.gob.inabif.sigrec.vehiculo.repository;

import java.util.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoAtencion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class VehiculoRepositoryImpl implements VehiculoRepository {
    private final VehiculoJpaRepository jpaRepository;

    @Override
    public Optional<Vehiculo> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Vehiculo> findAllByOrderById() { return jpaRepository.findAllByOrderById(); }

    @Override
    public List<Vehiculo> listarAmbito(Collection<String> centros, Collection<String> codigos) { return jpaRepository.listarAmbito(centros, codigos); }

    @Override
    public List<VehiculoAtencion> atencionGlobal() { return jpaRepository.atencionGlobal(); }

    @Override
    public List<VehiculoAtencion> atencionAmbito(Collection<String> centros, Collection<String> codigos) { return jpaRepository.atencionAmbito(centros, codigos); }

    @Override
    public boolean existsByCodigo(String codigo) { return jpaRepository.existsByCodigo(codigo); }

    @Override
    public boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado) { return jpaRepository.existsByCentroIdAndEstadoAndEliminado(centroId, estado, eliminado); }

    @Override
    public Optional<Vehiculo> bloquear(String codigo) { return jpaRepository.bloquear(codigo); }

    @Override
    public boolean placaOcupada(String placa, Long id) { return jpaRepository.placaOcupada(placa, id); }

    @Override
    public Vehiculo save(Vehiculo registro) { return jpaRepository.save(registro); }
}
