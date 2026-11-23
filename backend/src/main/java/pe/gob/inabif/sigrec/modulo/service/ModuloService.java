package pe.gob.inabif.sigrec.modulo.service;

import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.modulo.dtos.CreateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.UpdateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

public interface ModuloService {
    CambioResponse<ModuloResponse> crear(CreateModuloRequest request);
    CambioResponse<ModuloResponse> editar(String codigo, UpdateModuloRequest request);
    ModuloResponse cambiarEstado(String codigo, String motivo);
}
