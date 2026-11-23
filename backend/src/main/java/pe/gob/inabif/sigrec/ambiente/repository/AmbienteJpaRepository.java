package pe.gob.inabif.sigrec.ambiente.repository;

import pe.gob.inabif.sigrec.ambiente.model.Ambiente;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface AmbienteJpaRepository extends JpaRepository<Ambiente, Long> {
    Optional<Ambiente> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Ambiente> findByModuloIdInOrderById(Collection<Long> modulos);
    List<Ambiente> findByModuloId(Long modulo);
}
