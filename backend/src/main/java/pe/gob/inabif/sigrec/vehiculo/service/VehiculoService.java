package pe.gob.inabif.sigrec.vehiculo.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;

public interface VehiculoService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<VehiculoResponse> listar(FiltroConsulta filtro);

    default List<VehiculoResponse> listar() { return listar(FiltroConsulta.TODO); }

    VehiculoResponse crear(CreateVehiculoRequest request);
    VehiculoResponse editar(String codigo, UpdateVehiculoRequest request);
    VehiculoResponse cambiarEstado(String codigo, String motivo);
}
