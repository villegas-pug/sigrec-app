package pe.gob.inabif.sigrec.incidencia.service;

import pe.gob.inabif.sigrec.bien.dtos.BienResponse;
import pe.gob.inabif.sigrec.incidencia.dtos.IncidenciaOperaciones;
import pe.gob.inabif.sigrec.incidencia.dtos.IncidenciaResponse;

public interface PatrimonioService {
    IncidenciaResponse darDeBaja(String rotulo, IncidenciaOperaciones.Baja datos);
    BienResponse reponer(String rotulo, IncidenciaOperaciones.Reponer datos);
    void anularBaja(String codigo, String motivo);
    void anularReposicion(String codigo, String motivo);
}
