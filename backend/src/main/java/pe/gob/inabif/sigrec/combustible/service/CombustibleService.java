package pe.gob.inabif.sigrec.combustible.service;

import java.util.List;
import pe.gob.inabif.sigrec.combustible.dtos.*;

public interface CombustibleService {
    List<CombustibleResponse> listar();
    CombustibleResponse crear(CreateCombustibleRequest request);
    CombustibleResponse editar(String codigo, UpdateCombustibleRequest request);
    CombustibleResponse cambiarEstado(String codigo, String motivo);
}
