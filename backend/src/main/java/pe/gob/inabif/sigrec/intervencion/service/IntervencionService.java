package pe.gob.inabif.sigrec.intervencion.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.intervencion.dtos.*;

public interface IntervencionService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<IntervencionResponse> listar(FiltroConsulta filtro);

    default List<IntervencionResponse> listar() { return listar(FiltroConsulta.TODO); }

    IntervencionResponse.Cambio crear(CreateIntervencionRequest request);
    IntervencionResponse.Cambio editar(String codigo, UpdateIntervencionRequest request);
    IntervencionResponse.Cambio cambiarEstado(String codigo, String motivo);
}
