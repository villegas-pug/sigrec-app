package pe.gob.inabif.sigrec.inicio.calculo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
import pe.gob.inabif.sigrec.bien.dtos.BienResponse;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoResponse;

/**
 * SPEC 044. Índices de solo lectura sobre las colecciones de Inicio. Equivale a {@code db} y a los helpers de
 * {@code frontend/src/services/datos.js}: una baja lógica (con sello de anulación) deja de contar.
 */
final class Contexto {
    final InicioDatosResponse datos;
    final LocalDate hoy;
    final List<String> elementosBase;

    final List<CentroResponse> carsVigentes;
    final Map<String, CentroResponse> carPorId = new HashMap<>();
    final Map<String, ModuloResponse> moduloPorId = new HashMap<>();
    final Map<String, AmbienteResponse> ambientePorId = new HashMap<>();
    final Map<String, BienResponse> bienPorId = new HashMap<>();
    final Map<String, VehiculoResponse> vehiculoPorId = new HashMap<>();
    final Map<String, BigDecimal> precioPorTipo = new HashMap<>();
    final List<Hecho> hechos;
    private final Set<String> bajas = new HashSet<>();
    private final Set<String> verificados = new HashSet<>();

    Contexto(InicioDatosResponse datos, List<String> elementosBase, LocalDate hoy) {
        this.datos = datos;
        this.hoy = hoy;
        this.elementosBase = elementosBase;
        datos.jerarquia().cars().forEach(c -> carPorId.putIfAbsent(c.id(), c));
        datos.jerarquia().modulos().forEach(m -> moduloPorId.putIfAbsent(m.id(), m));
        datos.jerarquia().ambientes().forEach(a -> ambientePorId.putIfAbsent(a.id(), a));
        datos.inventario().bienes().forEach(b -> bienPorId.putIfAbsent(b.id(), b));
        datos.vehiculos().forEach(v -> vehiculoPorId.putIfAbsent(v.id(), v));
        // El importe usa el precio actual del tipo; sin precio no se valora (nunca se asume cero). Como en la SPA, el precio
        // solo se asocia a los tipos que existen en el catálogo de tipos de bien.
        var tipos = datos.tiposBien().stream().map(t -> t.id()).collect(Collectors.toSet());
        datos.precios().forEach(p -> {
            if (p.precio() != null && tipos.contains(p.tipoId())) precioPorTipo.putIfAbsent(p.tipoId(), p.precio());
        });
        carsVigentes = datos.jerarquia().cars().stream().filter(c -> c.anulacion() == null).toList();
        hechos = datos.inventario().eventos().stream().map(Hecho::desde).toList();
        for (var h : hechos) {
            if (h.novedad() || !h.vigente()) continue;
            if ("baja".equals(h.tipo()) && !h.bienIds().isEmpty()) bajas.add(h.bienIds().get(0));
            if ("verificacion".equals(h.tipo())) verificados.addAll(h.bienIds());
        }
    }

    List<String> idsCarsVigentes() {
        return carsVigentes.stream().map(CentroResponse::id).toList();
    }

    /** Un bien está activo si no está anulado ni tiene una baja vigente. */
    boolean activo(BienResponse bien) {
        return bien.anulacion() == null && !bajas.contains(bien.id());
    }

    boolean verificado(BienResponse bien) {
        return verificados.contains(bien.id());
    }

    List<ModuloResponse> modulosDeCar(String carId) {
        return datos.jerarquia().modulos().stream().filter(m -> m.anulacion() == null && Objects.equals(m.carId(), carId)).toList();
    }

    List<AmbienteResponse> ambientesDeCar(String carId) {
        return datos.jerarquia().ambientes().stream().filter(a -> a.anulacion() == null && Objects.equals(a.carId(), carId)).toList();
    }

    /** Eventos que no son novedades ni verificaciones de la carga inicial. */
    List<Hecho> eventosRegistrados() {
        return hechos.stream().filter(h -> !h.novedad() && !h.cargaInicial()).toList();
    }

    List<Hecho> novedadesDe(String ambienteId) {
        return hechos.stream().filter(h -> h.novedad() && Objects.equals(h.ambienteId(), ambienteId)).toList();
    }

    /** Vehículos vigentes cuyo centro existe en la jerarquía (también si el centro está anulado). */
    List<VehiculoResponse> vehiculosEnAmbito() {
        return datos.vehiculos().stream().filter(v -> carPorId.containsKey(v.carId()) && v.anulacion() == null).toList();
    }

    /** {@code Centro › Módulo › Ambiente}; omite los niveles que no existen. */
    static String textoUbicacion(CentroResponse car, ModuloResponse modulo, AmbienteResponse ambiente) {
        var partes = new ArrayList<String>();
        if (car != null && car.nombre() != null && !car.nombre().isEmpty()) partes.add(car.nombre());
        if (modulo != null && modulo.nombre() != null && !modulo.nombre().isEmpty()) partes.add(modulo.nombre());
        if (ambiente != null && ambiente.nombre() != null && !ambiente.nombre().isEmpty()) partes.add(ambiente.nombre());
        return partes.stream().collect(Collectors.joining(" › "));
    }
}
