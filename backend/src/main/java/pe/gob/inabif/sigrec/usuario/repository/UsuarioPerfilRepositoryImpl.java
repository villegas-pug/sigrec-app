package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UsuarioPerfilRepositoryImpl implements UsuarioPerfilRepository {
    private final UsuarioPerfilJpaRepository jpaRepository;

    @Override
    public List<UsuarioPerfil> findByUsuarioIdOrderById(Long id) {
        return jpaRepository.findByUsuarioIdOrderById(id);
    }

    @Override
    public UsuarioPerfil save(UsuarioPerfil asignacion) {
        return jpaRepository.save(asignacion);
    }
}
