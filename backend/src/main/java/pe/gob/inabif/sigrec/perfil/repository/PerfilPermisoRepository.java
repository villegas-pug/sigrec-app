package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.PerfilPermiso;
import java.util.*;

public interface PerfilPermisoRepository {
    List<PerfilPermiso> findByPerfilIdOrderByOrdenAscIdAsc(Long id);
}
