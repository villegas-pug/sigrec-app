package pe.gob.inabif.sigrec.security;

import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoAtencion;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Component
@RequiredArgsConstructor
public class MovilidadAcceso {
    private final Acceso acceso;
    private final VehiculoRepository vehiculos;

    public List<Vehiculo> listar(String... rutas) {
        var ambito = ambito(rutas);
        return ambito.global() ? vehiculos.findAllByOrderById() : vehiculos.listarAmbito(ambito.centros(), ambito.codigos());
    }

    /** Conserva exactamente el ámbito de listar, pero evita cargar vehículos ajenos al indicador. */
    public List<VehiculoAtencion> listarAtencion(String... rutas) {
        var ambito = ambito(rutas);
        return ambito.global() ? vehiculos.atencionGlobal() : vehiculos.atencionAmbito(ambito.centros(), ambito.codigos());
    }

    private record Ambito(boolean global, List<String> centros, List<String> codigos) {}

    private Ambito ambito(String... rutas) {
        var grants = porRuta(rutas);
        if (grants.stream().anyMatch(Acceso.Asignacion::global)) return new Ambito(true, List.of(), List.of());
        var centros = grants.stream().filter(a -> "CENTRO".equals(a.alcance())).map(a -> a.centro().codigo()).distinct().toList();
        var codigos = grants.stream().map(Acceso.Asignacion::vehiculo).filter(Objects::nonNull).distinct().toList();
        return new Ambito(false, centros, codigos);
    }

    public List<Acceso.Asignacion> porRuta(String... rutas) {
        var grants = acceso.concesiones().stream().filter(a -> Arrays.stream(rutas).anyMatch(a.rutas()::contains)).toList();
        if (grants.isEmpty()) throw new AccessDeniedException("Consulta de movilidad no autorizada.");
        return grants;
    }

    public Vehiculo bloquear(String codigo, String ruta, String... acciones) {
        var grants = porRuta(ruta).stream().filter(a -> Arrays.stream(acciones).anyMatch(a.acciones()::contains)).toList();
        if (grants.isEmpty()) throw new AccessDeniedException("Acción de movilidad no autorizada.");
        var vehiculo = vehiculos.bloquear(codigo).orElseThrow(() -> noDisponible());
        if (grants.stream().noneMatch(a -> cubre(a, vehiculo))) throw noDisponible();
        return vehiculo;
    }

    public boolean permite(List<Acceso.Asignacion> grants, Vehiculo vehiculo, String accion) {
        return grants.stream().anyMatch(a -> cubre(a, vehiculo) && a.acciones().contains(accion));
    }

    public boolean cubre(Acceso.Asignacion a, Vehiculo v) {
        return a.cubreCentro(v.getCentro().codigo()) || ("VEHICULO".equals(a.alcance()) && v.getCodigo().equals(a.vehiculo()));
    }

    public void exigirVigente(Vehiculo v) {
        if (!v.getCentro().vigente() || !v.vigente()) throw conflicto("El vehículo no está vigente.");
    }
}
