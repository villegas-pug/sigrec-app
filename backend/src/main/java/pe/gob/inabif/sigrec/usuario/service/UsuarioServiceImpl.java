package pe.gob.inabif.sigrec.usuario.service;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.perfil.model.Perfil;
import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import pe.gob.inabif.sigrec.security.VehiculosRegistrados;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.security.Identidad;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioPerfilRepository;
import pe.gob.inabif.sigrec.perfil.repository.PerfilRepository;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.usuario.dtos.*;
import pe.gob.inabif.sigrec.usuario.mappers.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UsuarioServiceImpl implements UsuarioService {
    private final UsuarioRepository usuarios;
    private final PerfilRepository perfiles;
    private final UsuarioPerfilRepository asignaciones;
    private final CentroRepository centros;
    private final VehiculosRegistrados vehiculos;
    private final Acceso acceso;
    private final UsuarioEntityMapper entityMapper;
    private final UsuarioUpdateMapper updateMapper;
    private final UsuarioResponseMapper responseMapper;

    public UsuarioServiceImpl(UsuarioRepository usuarios, PerfilRepository perfiles, UsuarioPerfilRepository asignaciones,
                    CentroRepository centros, VehiculosRegistrados vehiculos, Acceso acceso,
                    UsuarioEntityMapper entityMapper, UsuarioUpdateMapper updateMapper, UsuarioResponseMapper responseMapper) {
        this.usuarios = usuarios;
        this.perfiles = perfiles;
        this.asignaciones = asignaciones;
        this.centros = centros;
        this.vehiculos = vehiculos;
        this.acceso = acceso;
        this.entityMapper = entityMapper;
        this.updateMapper = updateMapper;
        this.responseMapper = responseMapper;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UsuarioResponse> listar() {
        acceso.global("usuario.consultar");
        return usuarios.findAllByOrderById().stream().filter(Usuario::humano).map(this::vista).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponse consultar(String codigo) {
        acceso.global("usuario.consultar");
        return vista(buscar(codigo));
    }

    @Override
    public UsuarioResponse actualizar(String codigo, UpdateUsuarioRequest request) {
        var datos = updateMapper.toModel(request);
        acceso.global("usuario.actualizar");
        var usuario = bloquear(codigo);
        entityMapper.fromModelToEntity(datos, usuario);
        usuario.actualizar(acceso.actor());
        return vista(usuario);
    }

    @Override
    public UsuarioResponse desactivar(String codigo, DesactivarUsuarioRequest motivo) {
        acceso.global("usuario.desactivar");
        var usuario = bloquear(codigo);
        var actor = acceso.actor();
        if (actor.id().equals(usuario.id())) throw error(HttpStatus.CONFLICT, "La cuenta en uso no puede desactivarse.");
        if (usuario.vigente()) {
            usuario.anular(actor, motivo.motivo().strip());
        }
        return vista(usuario);
    }

    @Override
    public UsuarioResponse asignar(String codigo, AsignarPerfilesRequest datos) {
        acceso.global("usuario.asignar");
        var usuario = bloquear(codigo);
        if (!usuario.vigente()) throw error(HttpStatus.CONFLICT, "La cuenta no está vigente.");
        var actor = acceso.actor();
        if (actor.id().equals(usuario.id()) && datos.asignaciones().stream().noneMatch(a -> "CENTRAL".equals(a.perfil()))) {
            throw error(HttpStatus.CONFLICT, "La cuenta en uso debe conservar su perfil central.");
        }

        var previas = new LinkedHashMap<AsignacionUsuario, UsuarioPerfil>();
        asignaciones.findByUsuarioIdOrderById(usuario.id()).forEach(a -> previas.put(asignacion(a), a));
        var unicas = new HashSet<AsignacionUsuario>();
        for (var entrada : datos.asignaciones()) {
            if (!unicas.add(entrada)) throw error(HttpStatus.BAD_REQUEST, "La asignación está duplicada.");
            var previa = previas.remove(entrada);
            if (previa != null) {
                if (!previa.vigente()) previa.reactivar(actor);
            } else {
                asignaciones.save(nuevaAsignacion(entrada, usuario, actor));
            }
        }
        previas.values().stream().filter(UsuarioPerfil::vigente).forEach(a -> a.anular(actor, "Se retiró la asignación."));
        return vista(usuario);
    }

    private UsuarioPerfil nuevaAsignacion(AsignacionUsuario entrada, Usuario usuario, Usuario actor) {
        var perfil = perfiles.findByCodigo(entrada.perfil()).filter(Perfil::vigente)
                .orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "El perfil no está disponible."));
        var alcance = alcance(perfil.getCodigo());
        Centro centro = null;
        String vehiculo = null;
        switch (alcance) {
            case GLOBAL -> {
                if (entrada.centro() != null || entrada.vehiculo() != null) throw ambitoInvalido();
            }
            case CENTRO -> {
                if (entrada.centro() == null || entrada.vehiculo() != null) throw ambitoInvalido();
                centro = centros.findByCodigo(entrada.centro()).filter(Centro::vigente).orElseThrow(this::ambitoInvalido);
            }
            case VEHICULO -> {
                if (entrada.vehiculo() == null || entrada.centro() != null) throw ambitoInvalido();
                vehiculos.centroVigente(entrada.vehiculo()).flatMap(centros::findByCodigo).filter(Centro::vigente).orElseThrow(this::ambitoInvalido);
                vehiculo = entrada.vehiculo();
            }
        }
        var a = new UsuarioPerfil();
        a.setPerfil(perfil);
        a.setUsuario(usuario);
        a.setAlcance(alcance);
        a.setCentro(centro);
        a.setVehiculo(vehiculo);
        a.registrar(actor);
        return a;
    }

    private UsuarioPerfil.Alcance alcance(String perfil) {
        return switch (perfil) {
            case "CENTRAL" -> UsuarioPerfil.Alcance.GLOBAL;
            case "CAR", "VERIFICA" -> UsuarioPerfil.Alcance.CENTRO;
            case "CHOFER" -> UsuarioPerfil.Alcance.VEHICULO;
            default -> throw error(HttpStatus.BAD_REQUEST, "El perfil no está disponible.");
        };
    }

    private UsuarioResponse vista(Usuario u) {
        var activos = asignaciones.findByUsuarioIdOrderById(u.id()).stream().filter(UsuarioPerfil::vigente).map(this::asignacion).toList();
        return responseMapper.toResponse(u, activos);
    }

    private AsignacionUsuario asignacion(UsuarioPerfil a) {
        return new AsignacionUsuario(a.getPerfil().getCodigo(), a.getCentro() == null ? null : a.getCentro().codigo(), a.getVehiculo());
    }

    private Usuario buscar(String codigo) {
        return usuarios.findByCodigo(Identidad.login(codigo)).filter(Usuario::humano).orElseThrow(this::noDisponible);
    }

    private Usuario bloquear(String codigo) {
        return usuarios.bloquear(Identidad.login(codigo)).filter(Usuario::humano).orElseThrow(this::noDisponible);
    }

    private ResponseStatusException ambitoInvalido() { return error(HttpStatus.BAD_REQUEST, "El ámbito no es válido para el perfil."); }
    private ResponseStatusException noDisponible() { return error(HttpStatus.NOT_FOUND, "Usuario no disponible."); }
    private ResponseStatusException error(HttpStatus status, String mensaje) { return new ResponseStatusException(status, mensaje); }

}
