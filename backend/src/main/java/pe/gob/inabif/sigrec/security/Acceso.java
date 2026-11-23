package pe.gob.inabif.sigrec.security;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.perfil.model.Perfil;
import pe.gob.inabif.sigrec.permiso.model.Permiso;
import pe.gob.inabif.sigrec.permiso.repository.PermisoRepository;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioPerfilRepository;
import pe.gob.inabif.sigrec.perfil.repository.PerfilPermisoRepository;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Único punto de control de acceso. SPEC 039: la identidad llega de la intranet (cabecera). Con
 * {@code sigrec.security.autorizacion=false} (valor por defecto, como educalle) el API no restringe por perfil ni
 * ámbito: el menú lo define SRH y la UI lo aplica.
 */
@Service
@Transactional(readOnly = true)
public class Acceso {
    private final UsuarioRepository usuarios;
    private final UsuarioPerfilRepository asignaciones;
    private final PerfilPermisoRepository permisos;
    private final PermisoRepository catalogoPermisos;
    private final CentroRepository centros;
    private final VehiculosRegistrados vehiculos;
    private final IdentidadIntranet intranet;
    private final UsuarioIntranet aprovisionamiento;
    private final boolean autorizacion;

    Acceso(UsuarioRepository usuarios, UsuarioPerfilRepository asignaciones, PerfilPermisoRepository permisos,
           PermisoRepository catalogoPermisos, CentroRepository centros,
           VehiculosRegistrados vehiculos, IdentidadIntranet intranet, UsuarioIntranet aprovisionamiento,
           @Value("${sigrec.security.autorizacion:false}") boolean autorizacion) {
        this.usuarios = usuarios;
        this.asignaciones = asignaciones;
        this.permisos = permisos;
        this.catalogoPermisos = catalogoPermisos;
        this.centros = centros;
        this.vehiculos = vehiculos;
        this.intranet = intranet;
        this.aprovisionamiento = aprovisionamiento;
        this.autorizacion = autorizacion;
    }

    /** Usuario de la intranet que realiza la llamada; se crea en su primer ingreso. */
    public Usuario actor() {
        var identidad = intranet.actual().orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ingrese desde la intranet para continuar."));
        var existente = usuarios.findByProveedorAndSujeto(Identidad.INTRANET, identidad.sujeto());
        if (existente.isEmpty()) {
            try {
                aprovisionamiento.crear(identidad);
            } catch (DataIntegrityViolationException otraPeticionLoCreo) {
                // Dos primeras llamadas simultáneas del mismo usuario: se vuelve a leer.
            }
            existente = usuarios.findByProveedorAndSujeto(Identidad.INTRANET, identidad.sujeto());
        }
        return existente.filter(u -> u.humano() && u.vigente())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La cuenta no está vigente."));
    }

    /** Concesiones que evalúan los servicios: las reales, o una global total si el API no autoriza. */
    public List<Asignacion> concesiones() {
        return autorizacion ? cuenta(actor()).asignaciones() : List.of(totalSinRestriccion());
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

        var centro = cent.map(c -> new ContextoCentro(c.codigo(), c.nombre())).orElse(null);
        return Optional.of(asignacion(a.id(), a.getPerfil(), a.getAlcance().name(), centro, a.getVehiculo(),
                permisosDe(a.getPerfil())));
    }

    private Asignacion totalSinRestriccion() {
        var todos = catalogoPermisos.findAll().stream().filter(Permiso::vigente).toList();
        return new Asignacion(0L, "INTRANET", "Sin restricción en el API", "GLOBAL", null, null,
                codigos(todos, "RUTA"), codigos(todos, "ACCION"));
    }

    private List<Permiso> permisosDe(Perfil perfil) {
        return permisos.findByPerfilIdOrderByOrdenAscIdAsc(perfil.id()).stream()
                .filter(p -> p.vigente() && p.getPermiso().vigente()).map(p -> p.getPermiso()).toList();
    }

    private static Asignacion asignacion(Long id, Perfil perfil, String alcance, ContextoCentro centro, String vehiculo,
                                         List<Permiso> permissions) {
        return new Asignacion(id, perfil.getCodigo(), perfil.getNombre(), alcance, centro, vehiculo,
                codigos(permissions, "RUTA"), codigos(permissions, "ACCION"));
    }

    private static List<String> codigos(List<Permiso> permissions, String tipo) {
        return permissions.stream().filter(p -> tipo.equals(p.getTipo())).map(Permiso::getCodigo).toList();
    }

    public void global(String permiso) {
        if (!autorizacion) return;
        if (concesiones().stream().noneMatch(a -> a.global() && a.acciones().contains(permiso))) {
            throw new AccessDeniedException("Permiso global requerido.");
        }
    }

    public void accionCentro(String permiso, String codigo) {
        accionCentro("centros", permiso, codigo);
    }

    public void accionCentro(String ruta, String permiso, String codigo) {
        if (!autorizacion) return;
        var grants = concesiones().stream()
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
        var grants = concesiones().stream()
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
