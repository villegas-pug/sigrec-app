package pe.gob.inabif.sigrec.servicio.service;

import java.util.List;
import pe.gob.inabif.sigrec.servicio.dtos.*;

public interface ServicioService {
    List<ServicioResponse> listar();
    ServicioResponse crear(CreateServicioRequest request);
    ServicioResponse editar(String codigo, UpdateServicioRequest request);
    ServicioResponse cambiarEstado(String codigo, String motivo);
    ServicioResponse informarPeriodo(String codigo, int anio, int numero, UpdatePeriodoRequest request);
    ServicioResponse guardarHecho(String codigo, String hecho, HechoServicioRequest request);
    ServicioResponse cambiarEstadoHecho(String codigo, String hecho, String motivo);
}
