package pe.gob.inabif.sigrec.mantenimiento.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;

public interface MantenimientoService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<MantenimientoResponse> listar(FiltroConsulta filtro);

    default List<MantenimientoResponse> listar() { return listar(FiltroConsulta.TODO); }

    MantenimientoResponse.Alta crear(CreateMantenimientoRequest request);
    MantenimientoResponse editar(String codigo, UpdateMantenimientoRequest request);
    MantenimientoResponse cambiarEstado(String codigo, String motivo);
}
