package pe.gob.inabif.sigrec.inicio.service;

import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;

public interface InicioService {
    /** Datos que necesita Inicio para calcular indicadores y avisos de atención. */
    InicioDatosResponse consultar();
}
