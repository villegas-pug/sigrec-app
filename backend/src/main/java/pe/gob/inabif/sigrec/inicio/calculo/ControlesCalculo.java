package pe.gob.inabif.sigrec.inicio.calculo;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoResponse;

/**
 * SPEC 044. Controles preventivos (espejo de {@code frontend/src/services/mantenimientos.js}): vencidos, por vencer,
 * extintores faltantes y fumigación. Solo cuenta el último registro vigente de cada objetivo.
 */
final class ControlesCalculo {
    /** Un control que requiere atención: {@code clase} es {@code vencido}, {@code por_vencer} o {@code faltante}. */
    record Pendiente(String clave, String clase, String carId, String tipo, String objetivo, MantenimientoResponse mantenimiento,
                     LocalDate proxima, Integer dias, int faltantes) {}

    /** Control programado dentro del horizonte de «Próximos»; {@code estado} es {@code por_vencer} o {@code al_dia}. */
    record Proximo(String clave, String carId, String tipo, String objetivo, MantenimientoResponse mantenimiento,
                   LocalDate proxima, int dias, String estado) {}

    record Resumen(long vencidos, long porVencer, long extintoresFaltantes) {}

    private final Contexto ctx;
    private final List<MantenimientoResponse> ordenados;

    ControlesCalculo(Contexto ctx) {
        this.ctx = ctx;
        // Del más reciente al más antiguo; a igual fecha, el registrado después va primero (se invierte y se ordena de forma estable).
        var vigentes = new ArrayList<>(ctx.datos.mantenimientos().stream().filter(m -> m.anulacion() == null).toList());
        java.util.Collections.reverse(vigentes);
        vigentes.sort(Comparator.comparing(MantenimientoResponse::fecha).reversed());
        this.ordenados = vigentes;
    }

    /** Sin fecha: «sin_programar» (no se asume que esté al día). */
    String estadoControl(LocalDate proxima) {
        if (proxima == null) return "sin_programar";
        int dias = ReglasInicio.dias(ctx.hoy, proxima);
        if (dias < 0) return "vencido";
        return dias <= ReglasInicio.DIAS_POR_VENCER ? "por_vencer" : "al_dia";
    }

    /** Estado de la fumigación del centro según su último registro. */
    String fumigacionDeCentro(String carId) {
        var ultimo = ordenados.stream().filter(m -> Objects.equals(m.carId(), carId) && "fumigacion".equals(m.tipo())).findFirst();
        return estadoControl(ultimo.map(MantenimientoResponse::proxima).orElse(null));
    }

    /** Faltantes de extintores de un centro; nulo si no se informó la dotación requerida (nunca se asume cero). */
    Integer extintoresFaltantes(String carId) {
        var car = ctx.carPorId.get(carId);
        var inmueble = car == null ? null : car.inmueble();
        var requeridos = inmueble == null || inmueble.seguridad() == null ? null : inmueble.seguridad().extintoresRequeridos();
        if (requeridos == null) return null;
        var ambientes = new HashSet<String>();
        ctx.ambientesDeCar(carId).forEach(a -> ambientes.add(a.id()));
        int activos = ctx.datos.inventario().bienes().stream()
                .filter(b -> ambientes.contains(b.ambienteId()) && ReglasInicio.TIPO_EXTINTOR.equals(b.tipoId()) && ctx.activo(b))
                .mapToInt(b -> b.cantidad() == null ? 1 : b.cantidad()).sum();
        return Math.max(0, requeridos - activos);
    }

    /** Último mantenimiento vigente de cada objetivo (tipo + bien o vehículo) de los centros indicados. */
    private List<MantenimientoResponse> ultimosPorObjetivo(List<String> carIds) {
        var grupos = new LinkedHashMap<String, MantenimientoResponse>();
        for (var m : ordenados) {
            if (carIds != null && !carIds.contains(m.carId())) continue;
            var clave = m.tipo() + "|" + m.carId() + "|" + (m.bienId() == null ? "" : m.bienId()) + "|" + (m.vehiculoId() == null ? "" : m.vehiculoId());
            grupos.putIfAbsent(clave, m);
        }
        return List.copyOf(grupos.values());
    }

    /** Texto del objetivo de un mantenimiento: el bien, el vehículo o el centro. */
    String objetivoDe(MantenimientoResponse m) {
        if (m.bienId() != null) {
            var bien = ctx.bienPorId.get(m.bienId());
            return bien == null ? m.bienId() : bien.nombre() + " " + bien.id();
        }
        if (m.vehiculoId() != null) {
            var v = ctx.vehiculoPorId.get(m.vehiculoId());
            return v == null ? m.vehiculoId() : v.tipo() + " " + v.id();
        }
        return "Centro";
    }

    /** Un bien dado de baja o un vehículo anulado ya no genera controles. */
    private boolean objetivoVigente(MantenimientoResponse m) {
        if (m.bienId() != null) {
            var bien = ctx.bienPorId.get(m.bienId());
            return bien != null && ctx.activo(bien);
        }
        if (m.vehiculoId() != null) {
            var v = ctx.vehiculoPorId.get(m.vehiculoId());
            return v != null && v.anulacion() == null;
        }
        return true;
    }

    private boolean centroVigente(String carId) {
        var car = ctx.carPorId.get(carId);
        return car != null && car.anulacion() == null;
    }

    /** Vencidos, por vencer y extintores faltantes de los centros indicados, en orden de gravedad. */
    List<Pendiente> pendientes(List<String> carIds) {
        var lista = new ArrayList<Pendiente>();
        for (var m : ultimosPorObjetivo(carIds)) {
            if (!objetivoVigente(m) || !centroVigente(m.carId())) continue;
            var estado = estadoControl(m.proxima());
            if (!estado.equals("vencido") && !estado.equals("por_vencer")) continue;
            lista.add(new Pendiente(m.id(), estado, m.carId(), m.tipo(), objetivoDe(m), m, m.proxima(),
                    ReglasInicio.dias(ctx.hoy, m.proxima()), 0));
        }
        for (var carId : carIds) {
            if (!centroVigente(carId)) continue;
            var faltantes = extintoresFaltantes(carId);
            if (faltantes != null && faltantes > 0) {
                lista.add(new Pendiente("faltantes-" + carId, "faltante", carId, "recarga_extintor", "Extintores", null, null, null, faltantes));
            }
        }
        lista.sort(Comparator.comparingInt((Pendiente p) -> peso(p.clase())).thenComparingInt(p -> p.dias() == null ? 0 : p.dias()));
        return lista;
    }

    private static int peso(String clase) {
        return switch (clase) {
            case "vencido" -> 0;
            case "faltante" -> 1;
            default -> 2;
        };
    }

    /** Controles cuya próxima fecha cae entre hoy y {@code dias} días después. No incluye los vencidos. */
    List<Proximo> proximos(List<String> carIds, int dias) {
        return ultimosPorObjetivo(carIds).stream()
                .filter(m -> m.proxima() != null && objetivoVigente(m) && centroVigente(m.carId()))
                .map(m -> new Proximo(m.id(), m.carId(), m.tipo(), objetivoDe(m), m, m.proxima(),
                        ReglasInicio.dias(ctx.hoy, m.proxima()), estadoControl(m.proxima())))
                .filter(c -> c.dias() >= 0 && c.dias() <= dias)
                .sorted(Comparator.comparingInt(Proximo::dias))
                .toList();
    }

    static Resumen resumir(List<Pendiente> pendientes) {
        return new Resumen(
                pendientes.stream().filter(p -> p.clase().equals("vencido")).count(),
                pendientes.stream().filter(p -> p.clase().equals("por_vencer")).count(),
                pendientes.stream().filter(p -> p.clase().equals("faltante")).mapToLong(Pendiente::faltantes).sum());
    }
}
