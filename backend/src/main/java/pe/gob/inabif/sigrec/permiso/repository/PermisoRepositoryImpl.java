package pe.gob.inabif.sigrec.permiso.repository;

import pe.gob.inabif.sigrec.permiso.model.Permiso;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PermisoRepositoryImpl implements PermisoRepository {
    private final PermisoJpaRepository jpaRepository;

    @Override
    public List<Permiso> findAll() {
        return jpaRepository.findAll();
    }
}
