package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.PerfilPermiso;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface PerfilPermisoJpaRepository extends JpaRepository<PerfilPermiso, Long> {
    @EntityGraph(attributePaths = "permiso")
    List<PerfilPermiso> findByPerfilIdOrderByOrdenAscIdAsc(Long id);
}
