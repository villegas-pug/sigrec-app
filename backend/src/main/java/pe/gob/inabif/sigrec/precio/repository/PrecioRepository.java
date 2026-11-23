package pe.gob.inabif.sigrec.precio.repository;

import java.util.List;
import java.util.Optional;
import pe.gob.inabif.sigrec.precio.model.Precio;

public interface PrecioRepository {
    List<Precio> listarActuales();
    List<Precio> listarConHistorial();
    List<Precio> listarPorTipo(Long tipoId);
    Optional<Precio> buscarActual(Long tipoId);
    boolean existsByTipoId(Long tipoId);
    Precio save(Precio precio);
    void flush();
}
