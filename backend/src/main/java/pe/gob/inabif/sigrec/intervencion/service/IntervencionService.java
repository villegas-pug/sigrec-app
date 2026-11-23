package pe.gob.inabif.sigrec.intervencion.service;

import java.util.List;
import pe.gob.inabif.sigrec.intervencion.dtos.*;

public interface IntervencionService {
    List<IntervencionResponse> listar();
    IntervencionResponse.Cambio crear(CreateIntervencionRequest request);
    IntervencionResponse.Cambio editar(String codigo, UpdateIntervencionRequest request);
    IntervencionResponse.Cambio cambiarEstado(String codigo, String motivo);
}
