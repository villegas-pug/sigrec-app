package pe.gob.inabif.sigrec.foto.repository;

import java.util.*;
import pe.gob.inabif.sigrec.foto.model.Foto;

public interface FotoRepository {
    Optional<Foto> findByCodigo(String codigo);
    List<Foto> findAllByOrderById();
    List<Foto> listarAmbito(Collection<String> centros);
    Foto save(Foto registro);
}
