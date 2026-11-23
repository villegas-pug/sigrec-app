package pe.gob.inabif.sigrec.vehiculo.service;

import java.util.List;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;

public interface VehiculoService {
    List<VehiculoResponse> listar();
    VehiculoResponse crear(CreateVehiculoRequest request);
    VehiculoResponse editar(String codigo, UpdateVehiculoRequest request);
    VehiculoResponse cambiarEstado(String codigo, String motivo);
}
