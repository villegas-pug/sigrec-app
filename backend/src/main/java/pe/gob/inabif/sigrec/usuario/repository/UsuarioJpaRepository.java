package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.Usuario;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

@org.springframework.stereotype.Repository
public interface UsuarioJpaRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCodigo(String codigo);
    Optional<Usuario> findByProveedorAndSujeto(String proveedor, String sujeto);
    List<Usuario> findAllByOrderById();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.codigo = :codigo")
    Optional<Usuario> bloquear(@Param("codigo") String codigo);
}
