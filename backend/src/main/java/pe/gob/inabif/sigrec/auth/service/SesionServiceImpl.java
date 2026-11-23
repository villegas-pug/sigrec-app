package pe.gob.inabif.sigrec.auth.service;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.auth.repository.SesionRepository;
import pe.gob.inabif.sigrec.auth.mappers.AuthEntityMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionServiceImpl implements SesionService {
    private final SesionRepository sesiones;

    private final AuthEntityMapper mapper;

    public SesionServiceImpl(SesionRepository sesiones, AuthEntityMapper mapper) {
        this.sesiones = sesiones;
        this.mapper = mapper;
    }

    @Transactional
    @Override
    public void iniciar(Usuario usuario, String jti, Instant expira) {
        sesiones.save(mapper.toEntity(usuario, hash(jti), expira));
    }

    @Transactional(readOnly = true)
    @Override
    public boolean vigente(Jwt jwt) {
        if (jwt.getId() == null || jwt.getSubject() == null) return false;
        return sesiones.findByHashAndRevocadaIsNull(hash(jwt.getId()))
                .filter(s -> s.getExpira().isAfter(Instant.now()))
                .filter(s -> s.getUsuario().humano() && s.getUsuario().vigente() && s.getUsuario().id().toString().equals(jwt.getSubject()))
                .isPresent();
    }

    @Transactional
    @Override
    public void cerrar(String jti) { sesiones.revocar(hash(jti), Instant.now()); }

    static String hash(String jti) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(jti.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
