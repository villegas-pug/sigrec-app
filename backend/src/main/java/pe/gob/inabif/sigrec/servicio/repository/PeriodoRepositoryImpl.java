package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Periodo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PeriodoRepositoryImpl implements PeriodoRepository {
    private final PeriodoJpaRepository jpaRepository;

    @Override
    public List<Periodo> findByServicioIdOrderByAnioAscNumeroAsc(Long servicioId) { return jpaRepository.findByServicioIdOrderByAnioAscNumeroAsc(servicioId); }

    @Override
    public Optional<Periodo> findByServicioIdAndAnioAndMesesAndNumero(Long servicioId, int anio, int meses, int numero) { return jpaRepository.findByServicioIdAndAnioAndMesesAndNumero(servicioId, anio, meses, numero); }

    @Override
    public Periodo save(Periodo registro) { return jpaRepository.save(registro); }
}
