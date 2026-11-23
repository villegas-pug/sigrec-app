package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Servicio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ServicioRepositoryImpl implements ServicioRepository {
    private final ServicioJpaRepository jpaRepository;

    @Override
    public Optional<Servicio> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Servicio> findByCentroCodigoInOrderById(Collection<String> centros) { return jpaRepository.findByCentroCodigoInOrderById(centros); }

    @Override
    public List<Servicio> findAllByOrderById() { return jpaRepository.findAllByOrderById(); }

    @Override
    public Optional<String> centroDe(String codigo) { return jpaRepository.centroDe(codigo); }

    @Override
    public boolean existsByCodigo(String codigo) { return jpaRepository.existsByCodigo(codigo); }

    @Override
    public boolean existsByCentroIdAndTipoIdAndEstadoAndEliminado(Long centroId, Long tipoId, int estado, int eliminado) { return jpaRepository.existsByCentroIdAndTipoIdAndEstadoAndEliminado(centroId, tipoId, estado, eliminado); }

    @Override
    public boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado) { return jpaRepository.existsByCentroIdAndEstadoAndEliminado(centroId, estado, eliminado); }

    @Override
    public Servicio save(Servicio registro) { return jpaRepository.save(registro); }
}
