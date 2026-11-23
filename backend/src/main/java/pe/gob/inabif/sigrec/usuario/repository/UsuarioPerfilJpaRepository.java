package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface UsuarioPerfilJpaRepository extends JpaRepository<UsuarioPerfil, Long> {
    @EntityGraph(attributePaths = {"perfil", "centro"})
    List<UsuarioPerfil> findByUsuarioIdOrderById(Long id);
}
