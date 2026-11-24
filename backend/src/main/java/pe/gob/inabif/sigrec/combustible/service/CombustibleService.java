package pe.gob.inabif.sigrec.combustible.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.combustible.dtos.*;

public interface CombustibleService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<CombustibleResponse> listar(FiltroConsulta filtro);

    default List<CombustibleResponse> listar() { return listar(FiltroConsulta.TODO); }

    CombustibleResponse crear(CreateCombustibleRequest request);
    CombustibleResponse editar(String codigo, UpdateCombustibleRequest request);
    CombustibleResponse cambiarEstado(String codigo, String motivo);
}
