package pe.gob.inabif.sigrec.catalogo.repository;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface CatalogoJpaRepository extends JpaRepository<Catalogo, Long> {
    Optional<Catalogo> findByDominioAndCodigo(String dominio, String codigo);
    List<Catalogo> findByDominioOrderById(String dominio);
    List<Catalogo> findAllByOrderById();
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Catalogo c where c.dominio = :dominio and c.codigo = :codigo")
    Optional<Catalogo> bloquear(String dominio, String codigo);
}
