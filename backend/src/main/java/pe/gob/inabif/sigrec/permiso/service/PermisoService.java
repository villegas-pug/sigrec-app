package pe.gob.inabif.sigrec.permiso.service;

import pe.gob.inabif.sigrec.permiso.dtos.PermisoResponse;
import java.util.List;

public interface PermisoService {
    List<PermisoResponse> listar();
}
