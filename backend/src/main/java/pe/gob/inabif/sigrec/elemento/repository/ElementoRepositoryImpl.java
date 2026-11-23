package pe.gob.inabif.sigrec.elemento.repository;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ElementoRepositoryImpl implements ElementoRepository {
    private final ElementoJpaRepository jpaRepository;

    @Override
    public List<Elemento> findByCentroIdInOrderById(Collection<Long> ids) {
        return jpaRepository.findByCentroIdInOrderById(ids);
    }

    @Override
    public List<Elemento> findByModuloIdInOrderById(Collection<Long> ids) {
        return jpaRepository.findByModuloIdInOrderById(ids);
    }

    @Override
    public List<Elemento> findByAmbienteIdInOrderById(Collection<Long> ids) {
        return jpaRepository.findByAmbienteIdInOrderById(ids);
    }

    @Override
    public Elemento save(Elemento elemento) {
        return jpaRepository.save(elemento);
    }
}
