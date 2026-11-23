package pe.gob.inabif.sigrec.ambiente.service;

import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import pe.gob.inabif.sigrec.ambiente.dtos.CreateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.UpdateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

public interface AmbienteService {
    CambioResponse<AmbienteResponse> crear(CreateAmbienteRequest request);
    CambioResponse<AmbienteResponse> editar(String codigo, UpdateAmbienteRequest request);
    AmbienteResponse cambiarEstado(String codigo, String motivo);
    void importar(AmbienteDatos datos, String codigo, Usuario actor);
}
