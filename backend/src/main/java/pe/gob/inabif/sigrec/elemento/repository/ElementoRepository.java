package pe.gob.inabif.sigrec.elemento.repository;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import java.util.*;

public interface ElementoRepository {
    List<Elemento> findByCentroIdInOrderById(Collection<Long> ids);
    List<Elemento> findByModuloIdInOrderById(Collection<Long> ids);
    List<Elemento> findByAmbienteIdInOrderById(Collection<Long> ids);
    Elemento save(Elemento elemento);
}
