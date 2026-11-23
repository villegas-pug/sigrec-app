package pe.gob.inabif.sigrec.vehiculo.repository;

import java.util.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

public interface VehiculoRepository {
    Optional<Vehiculo> findByCodigo(String codigo);
    List<Vehiculo> findAllByOrderById();
    List<Vehiculo> listarAmbito(Collection<String> centros, Collection<String> codigos);
    boolean existsByCodigo(String codigo);
    boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado);
    Optional<Vehiculo> bloquear(String codigo);
    boolean placaOcupada(String placa, Long id);
    Vehiculo save(Vehiculo registro);
}
