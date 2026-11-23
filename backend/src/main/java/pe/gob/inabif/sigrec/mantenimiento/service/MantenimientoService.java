package pe.gob.inabif.sigrec.mantenimiento.service;

import java.util.List;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;

public interface MantenimientoService {
    List<MantenimientoResponse> listar();
    MantenimientoResponse.Alta crear(CreateMantenimientoRequest request);
    MantenimientoResponse editar(String codigo, UpdateMantenimientoRequest request);
    MantenimientoResponse cambiarEstado(String codigo, String motivo);
}
