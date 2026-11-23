package pe.gob.inabif.sigrec.centro.service;

import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.centro.dtos.CreateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.UpdateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.centro.model.Centro;

public interface CentroService {
    CambioResponse<CentroResponse> crear(CreateCentroRequest request);
    CambioResponse<CentroResponse> editar(String codigo, UpdateCentroRequest request);
    CentroResponse cambiarEstado(String codigo, String motivo);
    Centro bloquear(String codigo);
}
