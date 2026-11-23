package pe.gob.inabif.sigrec.catalogo.repository;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CatalogoRepositoryImpl implements CatalogoRepository {
    private final CatalogoJpaRepository jpaRepository;

    @Override
    public Optional<Catalogo> findByDominioAndCodigo(String dominio, String codigo) {
        return jpaRepository.findByDominioAndCodigo(dominio, codigo);
    }

    @Override
    public List<Catalogo> findByDominioOrderById(String dominio) {
        return jpaRepository.findByDominioOrderById(dominio);
    }

    @Override
    public List<Catalogo> findAllByOrderById() {
        return jpaRepository.findAllByOrderById();
    }
    @Override public Optional<Catalogo> bloquear(String dominio, String codigo) { return jpaRepository.bloquear(dominio, codigo); }
    @Override public Catalogo save(Catalogo catalogo) { return jpaRepository.save(catalogo); }
}
