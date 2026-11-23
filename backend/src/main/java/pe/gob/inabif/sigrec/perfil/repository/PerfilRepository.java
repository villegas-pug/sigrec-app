package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.Perfil;
import java.util.*;

public interface PerfilRepository {
    Optional<Perfil> findByCodigo(String codigo);
    List<Perfil> findAll();
}
