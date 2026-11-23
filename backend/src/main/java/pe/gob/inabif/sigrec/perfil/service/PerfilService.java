package pe.gob.inabif.sigrec.perfil.service;

import pe.gob.inabif.sigrec.perfil.dtos.PerfilResponse;
import java.util.List;

public interface PerfilService {
    List<PerfilResponse> listar();
}
