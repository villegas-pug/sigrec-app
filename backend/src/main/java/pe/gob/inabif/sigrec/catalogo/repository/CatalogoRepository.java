package pe.gob.inabif.sigrec.catalogo.repository;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import java.util.*;

public interface CatalogoRepository {
    Optional<Catalogo> findByDominioAndCodigo(String dominio, String codigo);
    List<Catalogo> findByDominioOrderById(String dominio);
    List<Catalogo> findAllByOrderById();
    Optional<Catalogo> bloquear(String dominio, String codigo);
    Catalogo save(Catalogo catalogo);
}
