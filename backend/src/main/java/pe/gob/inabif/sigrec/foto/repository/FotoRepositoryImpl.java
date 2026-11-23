package pe.gob.inabif.sigrec.foto.repository;

import java.util.*;
import pe.gob.inabif.sigrec.foto.model.Foto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class FotoRepositoryImpl implements FotoRepository {
    private final FotoJpaRepository jpaRepository;

    @Override
    public Optional<Foto> findByCodigo(String codigo) { return jpaRepository.findByCodigo(codigo); }

    @Override
    public List<Foto> findAllByOrderById() { return jpaRepository.findAllByOrderById(); }

    @Override
    public List<Foto> listarAmbito(Collection<String> centros) { return jpaRepository.listarAmbito(centros); }

    @Override
    public Foto save(Foto registro) { return jpaRepository.save(registro); }
}
