package pe.gob.inabif.sigrec.elemento.repository;

import pe.gob.inabif.sigrec.elemento.model.Elemento;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface ElementoJpaRepository extends JpaRepository<Elemento, Long> {
    List<Elemento> findByCentroIdInOrderById(Collection<Long> ids);
    List<Elemento> findByModuloIdInOrderById(Collection<Long> ids);
    List<Elemento> findByAmbienteIdInOrderById(Collection<Long> ids);
}
