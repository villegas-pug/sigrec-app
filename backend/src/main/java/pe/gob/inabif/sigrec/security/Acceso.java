package pe.gob.inabif.sigrec.security;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.permiso.model.Permiso;
import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioPerfilRepository;
import pe.gob.inabif.sigrec.perfil.repository.PerfilPermisoRepository;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class Acceso {
    private final UsuarioRepository usuarios;
    private final UsuarioPerfilRepository asignaciones;
    private final PerfilPermisoRepository permisos;
    private final CentroRepository centros;
    private final VehiculosRegistrados vehiculos;

    Acceso(UsuarioRepository usuarios, UsuarioPerfilRepository asignaciones, PerfilPermisoRepository permisos,
           CentroRepository centros, VehiculosRegistrados vehiculos) {
        this.usuarios = usuarios;
        this.asignaciones = asignaciones;
        this.permisos = permisos;
        this.centros = centros;
        this.vehiculos = vehiculos;
    }

    public Usuario actor() {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken auth)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicie sesión para continuar.");
        }
        return usuario(Long.valueOf(auth.getName()));
    }

    public Cuenta cuenta() { return cuenta(actor()); }

    public Cuenta cuenta(Long id) { return cuenta(usuario(id)); }

    private Usuario usuario(Long id) {
        return usuarios.findById(id).filter(u -> u.humano() && u.vigente())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La cuenta no está vigente."));
    }

    private Cuenta cuenta(Usuario usuario) {
        var grants = asignaciones.findByUsuarioIdOrderById(usuario.id()).stream()
                .filter(a -> a.vigente() && a.getPerfil().vigente()).map(this::vista).flatMap(Optional::stream).toList();
        return new Cuenta(usuario.id(), usuario.getNombre(), grants);
    }

    private Optional<Asignacion> vista(UsuarioPerfil a) {
        var cent = switch (a.getAlcance()) {
            case GLOBAL -> Optional.<Centro>empty();
            case CENTRO -> Optional.of(a.getCentro());
            case VEHICULO -> vehiculos.centro(a.getVehiculo()).flatMap(centros::findByCodigo);
        };
        if (a.getAlcance() != UsuarioPerfil.Alcance.GLOBAL && cent.isEmpty()) return Optional.empty();

        var permissions = permisos.findByPerfilIdOrderByOrdenAscIdAsc(a.getPerfil().id()).stream()
                .filter(p -> p.vigente() && p.getPermiso().vigente()).map(p -> p.getPermiso()).toList();

        var rutas = permissions.stream().filter(p -> "RUTA".equals(p.getTipo())).map(p -> p.getCodigo()).toList();
        var acciones = permissions.stream().filter(p -> "ACCION".equals(p.getTipo())).map(p -> p.getCodigo()).toList();
        var centro = cent.map(c -> new ContextoCentro(c.codigo(), c.nombre())).orElse(null);
        var alcance = a.getAlcance().name();
        var perfil = a.getPerfil();
        return Optional.of(new Asignacion(a.id(), perfil.getCodigo(), perfil.getNombre(), alcance, centro, a.getVehiculo(), rutas, acciones));
    }

    public void global(String permiso) {
        if (cuenta().asignaciones().stream().noneMatch(a -> a.global() && a.acciones().contains(permiso))) {
            throw new AccessDeniedException("Permiso global requerido.");
        }
    }

    public void accionCentro(String permiso, String codigo) {
        accionCentro("centros", permiso, codigo);
    }

    public void accionCentro(String ruta, String permiso, String codigo) {
        var grants = cuenta().asignaciones().stream()
                .filter(a -> !"VEHICULO".equals(a.alcance()) && a.rutas().contains(ruta) && a.acciones().contains(permiso)).toList();
        if (grants.isEmpty()) throw new AccessDeniedException("Acción de centros no autorizada.");
        if (grants.stream().noneMatch(a -> a.cubreCentro(codigo))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no disponible.");
        }
    }

    public List<Asignacion> consultaCentros() {
        return consultaCentros("centros");
    }

    public List<Asignacion> consultaCentros(String ruta) {
        var grants = cuenta().asignaciones().stream()
                .filter(a -> a.rutas().contains(ruta) && !a.alcance().equals("VEHICULO")).toList();
        if (grants.isEmpty()) throw new AccessDeniedException("Consulta de centros no autorizada.");
        return grants;
    }

    public record Cuenta(Long id, String nombre, List<Asignacion> asignaciones) {}
    public record ContextoCentro(String codigo, String nombre) {}
    public record Asignacion(Long id, String perfil, String nombre, String alcance, ContextoCentro centro,
                             String vehiculo, List<String> rutas, List<String> acciones) {
        public boolean global() { return "GLOBAL".equals(alcance); }

        public boolean cubreCentro(String codigo) {
            return global() || ("CENTRO".equals(alcance) && centro != null && centro.codigo().equals(codigo));
        }
    }
}
