package pe.gob.inabif.sigrec.incidencia.service;

import pe.gob.inabif.sigrec.incidencia.dtos.*;

public interface IncidenciaService {
    IncidenciaResponse crear(CreateIncidenciaRequest request);
    IncidenciaResponse editar(String codigo, UpdateIncidenciaRequest request);
    void atender(String codigo, IncidenciaOperaciones.Atender request);
    void cambiarEstado(String codigo, String motivo);
}
