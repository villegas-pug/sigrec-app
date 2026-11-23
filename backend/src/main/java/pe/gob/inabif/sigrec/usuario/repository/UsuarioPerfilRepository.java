package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import java.util.*;

public interface UsuarioPerfilRepository {
    List<UsuarioPerfil> findByUsuarioIdOrderById(Long id);
    UsuarioPerfil save(UsuarioPerfil asignacion);
}
