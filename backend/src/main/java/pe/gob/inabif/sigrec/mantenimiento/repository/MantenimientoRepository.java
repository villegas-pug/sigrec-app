package pe.gob.inabif.sigrec.mantenimiento.repository;

import java.util.*;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;

public interface MantenimientoRepository {
    Optional<Mantenimiento> findByCodigo(String codigo);
    List<Mantenimiento> findAllByOrderById();
    List<Mantenimiento> listarAmbito(Collection<String> centros, Collection<Long> vehiculos);
    Mantenimiento save(Mantenimiento registro);
}
