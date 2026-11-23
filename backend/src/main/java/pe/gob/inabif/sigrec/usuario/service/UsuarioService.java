package pe.gob.inabif.sigrec.usuario.service;

import pe.gob.inabif.sigrec.usuario.dtos.*;
import java.util.List;

public interface UsuarioService {
    List<UsuarioResponse> listar();
    UsuarioResponse consultar(String codigo);
    UsuarioResponse crear(CreateUsuarioRequest datos);
    UsuarioResponse actualizar(String codigo, UpdateUsuarioRequest datos);
    UsuarioResponse desactivar(String codigo, DesactivarUsuarioRequest motivo);
    UsuarioResponse asignar(String codigo, AsignarPerfilesRequest datos);
}
