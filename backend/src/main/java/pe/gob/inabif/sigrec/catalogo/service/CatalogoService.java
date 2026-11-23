package pe.gob.inabif.sigrec.catalogo.service;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.dtos.CatalogoResponse;
import java.util.List;

public interface CatalogoService {
    Catalogo obtener(String dominio, String codigo);
    List<Catalogo> elementosBase();
    List<CatalogoResponse> listar(String dominio);
}
