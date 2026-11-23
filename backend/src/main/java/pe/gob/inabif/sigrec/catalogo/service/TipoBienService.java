package pe.gob.inabif.sigrec.catalogo.service;

import java.util.List;
import pe.gob.inabif.sigrec.catalogo.dtos.*;

public interface TipoBienService {
    List<TipoBienResponse> listar();
    TipoBienResponse crear(TipoBienRequest request);
    TipoBienResponse editar(String codigo, TipoBienRequest request);
    TipoBienResponse cambiarEstado(String codigo, String motivo);
}
