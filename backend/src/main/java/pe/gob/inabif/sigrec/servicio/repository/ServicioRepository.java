package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.Servicio;

public interface ServicioRepository {
    Optional<Servicio> findByCodigo(String codigo);
    List<Servicio> findByCentroCodigoInOrderById(Collection<String> centros);
    List<Servicio> findAllByOrderById();
    Optional<String> centroDe(String codigo);
    boolean existsByCodigo(String codigo);
    boolean existsByCentroIdAndTipoIdAndEstadoAndEliminado(Long centroId, Long tipoId, int estado, int eliminado);
    boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado);
    Servicio save(Servicio registro);
}
