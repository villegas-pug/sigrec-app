package pe.gob.inabif.sigrec.bien.service;

import pe.gob.inabif.sigrec.bien.dtos.InventarioResponse;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;

public interface InventarioConsulta {
    /** Registro sobre el que se aplica el periodo de los filtros de cabecera (SPEC 052). */
    enum Registro { BIEN, HECHO, CENTRO }

    InventarioResponse consultar(FiltroConsulta filtro, Registro registro);

    default InventarioResponse consultar() { return consultar(FiltroConsulta.TODO, null); }
}
