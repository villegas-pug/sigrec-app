package pe.gob.inabif.sigrec.auth.service;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import java.time.Instant;
import org.springframework.security.oauth2.jwt.Jwt;

public interface SesionService {
    void iniciar(Usuario usuario, String jti, Instant expira);
    boolean vigente(Jwt jwt);
    void cerrar(String jti);
}
