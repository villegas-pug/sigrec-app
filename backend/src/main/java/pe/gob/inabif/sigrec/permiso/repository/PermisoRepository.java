package pe.gob.inabif.sigrec.permiso.repository;

import pe.gob.inabif.sigrec.permiso.model.Permiso;
import java.util.*;

public interface PermisoRepository {
    List<Permiso> findAll();
}
