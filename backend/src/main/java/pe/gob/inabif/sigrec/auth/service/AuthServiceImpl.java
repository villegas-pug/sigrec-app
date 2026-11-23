package pe.gob.inabif.sigrec.auth.service;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.security.Identidad;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.auth.dtos.CreateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.UpdateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.TokenResponse;
import pe.gob.inabif.sigrec.auth.dtos.AuthResponse;
import pe.gob.inabif.sigrec.auth.mappers.AuthCreateMapper;
import pe.gob.inabif.sigrec.auth.mappers.AuthUpdateMapper;
import pe.gob.inabif.sigrec.auth.mappers.AuthResponseMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthServiceImpl implements AuthService {
    private final UsuarioRepository usuarios;
    private final SesionService sesiones;
    private final PasswordEncoder bcrypt;
    private final JwtEncoder encoder;
    private final String issuer;
    private final String audience;
    private final Duration ttl;
    private final String hashRelleno;
    private final Acceso acceso;
    private final AuthCreateMapper createMapper;
    private final AuthUpdateMapper updateMapper;
    private final AuthResponseMapper responseMapper;

    public AuthServiceImpl(UsuarioRepository usuarios, SesionService sesiones, PasswordEncoder bcrypt, JwtEncoder encoder,
                @Value("${sigrec.security.jwt.issuer}") String issuer, @Value("${sigrec.security.jwt.audience}") String audience,
                @Value("${sigrec.security.jwt.ttl}") Duration ttl, Acceso acceso, AuthCreateMapper createMapper,
                AuthUpdateMapper updateMapper, AuthResponseMapper responseMapper) {
        this.usuarios = usuarios;
        this.sesiones = sesiones;
        this.bcrypt = bcrypt;
        this.encoder = encoder;
        this.issuer = issuer;
        this.audience = audience;
        this.ttl = ttl;
        this.acceso = acceso;
        this.createMapper = createMapper;
        this.updateMapper = updateMapper;
        this.responseMapper = responseMapper;
        hashRelleno = bcrypt.encode(UUID.randomUUID().toString());
    }

    @Transactional
    @Override
    public TokenResponse iniciar(CreateAuthRequest request) {
        var credenciales = createMapper.toModel(request);
        var login = credenciales.usuario();
        var password = credenciales.password();
        if (!Identidad.longitudPasswordValida(password)) throw credencialesInvalidas();
        Usuario cuenta = usuarios.findByProveedorAndSujeto(Identidad.LOCAL, Identidad.login(login))
                .filter(u -> u.humano() && u.vigente()).orElse(null);
        boolean coincidencia = bcrypt.matches(password, cuenta == null ? hashRelleno : cuenta.getPasswordHash());
        if (cuenta == null || !coincidencia) throw credencialesInvalidas();

        var ahora = Instant.now();
        var expira = ahora.plus(ttl);
        var jti = UUID.randomUUID().toString();
        var claims = JwtClaimsSet.builder().issuer(issuer).subject(cuenta.id().toString()).audience(List.of(audience))
                .issuedAt(ahora).expiresAt(expira).id(jti).build();
        var valor = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        sesiones.iniciar(cuenta, jti, expira);
        return new TokenResponse(valor, ttl);
    }

    private ResponseStatusException credencialesInvalidas() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
    }

    @Override
    public AuthResponse consultar(Long usuario) { return responseMapper.toResponse(acceso.cuenta(usuario)); }

    @Override
    public void cerrar(UpdateAuthRequest request) { sesiones.cerrar(updateMapper.tokenId(request)); }
}
