package pe.gob.inabif.sigrec.bien.repository;

import pe.gob.inabif.sigrec.bien.model.HistorialBien;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class HistorialBienRepositoryImpl implements HistorialBienRepository {
    private final HistorialBienJpaRepository jpaRepository;

    @Override
    public Optional<HistorialBien> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<HistorialBien> findByBienAmbienteModuloCentroCodigoInOrderById(Collection<String> centros) {
        return jpaRepository.findByBienAmbienteModuloCentroCodigoInOrderById(centros);
    }

    @Override
    public List<HistorialBien> findByBienId(Long id) {
        return jpaRepository.findByBienId(id);
    }

    @Override
    public HistorialBien save(HistorialBien hecho) {
        return jpaRepository.save(hecho);
    }
}
