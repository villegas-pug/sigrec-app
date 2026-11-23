package pe.gob.inabif.sigrec.elemento.service;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import java.util.List;
import java.util.Map;

public interface ElementoService {
    List<Elemento> reemplazar(Centro centro, Modulo modulo, Ambiente ambiente, Map<String, String> estados, List<Adicional> adicionales, Usuario actor);
}
