package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.PerfilPermiso;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PerfilPermisoRepositoryImpl implements PerfilPermisoRepository {
    private final PerfilPermisoJpaRepository jpaRepository;

    @Override
    public List<PerfilPermiso> findByPerfilIdOrderByOrdenAscIdAsc(Long id) {
        return jpaRepository.findByPerfilIdOrderByOrdenAscIdAsc(id);
    }
}
