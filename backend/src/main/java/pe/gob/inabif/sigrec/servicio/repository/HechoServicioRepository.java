package pe.gob.inabif.sigrec.servicio.repository;

import java.util.*;
import pe.gob.inabif.sigrec.servicio.model.HechoServicio;

public interface HechoServicioRepository {
    Optional<HechoServicio> findByCodigo(String codigo);
    List<HechoServicio> listarPorServicio(Long servicioId);
    HechoServicio save(HechoServicio registro);
}
