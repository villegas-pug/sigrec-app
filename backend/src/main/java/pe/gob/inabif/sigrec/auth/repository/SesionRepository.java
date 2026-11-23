package pe.gob.inabif.sigrec.auth.repository;

import pe.gob.inabif.sigrec.auth.model.Sesion;
import java.util.*;
import java.time.Instant;

public interface SesionRepository {
    Optional<Sesion> findByHashAndRevocadaIsNull(String hash);
    void revocarTodas(Long usuario, Instant ahora);
    void revocar(String hash, Instant ahora);
    Sesion save(Sesion sesion);
}
