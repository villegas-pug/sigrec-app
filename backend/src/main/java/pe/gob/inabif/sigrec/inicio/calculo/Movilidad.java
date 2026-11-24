package pe.gob.inabif.sigrec.inicio.calculo;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioResponse;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoResponse;

/**
 * SPEC 044. Vehículos y recorridos (espejo de {@code frontend/src/services/vehiculos.js} y {@code combustible.js}).
 */
final class Movilidad {
    record ResumenVehiculos(long total, long operativos, long requierenMantenimiento, long detenidos, long sinInformar,
                            long requierenAtencion, BigDecimal presupuestoEstimado, long sinEstimar) {}

    /** {@code estado}: solo_previsto, comparable o no_comparable; {@code faltantes} explica qué impide comparar. */
    record Recorrido(ItinerarioResponse itinerario, VehiculoResponse vehiculo, String estado, List<String> faltantes) {}

    private final Contexto ctx;

    Movilidad(Contexto ctx) {
        this.ctx = ctx;
    }

    static boolean requiereAtencion(VehiculoResponse v) {
        return ReglasInicio.ESTADOS_VEHICULO_CON_ATENCION.contains(v.estadoOperativo());
    }

    /**
     * Solo cuentan los vehículos vigentes. Un vehículo sin estado informado no se cuenta como operativo. El presupuesto
     * estimado suma solo los que requieren atención y lo informaron; los demás van a {@code sinEstimar} (nunca se asume cero).
     */
    ResumenVehiculos resumirDeCar(String carId) {
        var activos = ctx.datos.vehiculos().stream().filter(v -> Objects.equals(v.carId(), carId) && v.anulacion() == null).toList();
        var conAtencion = activos.stream().filter(Movilidad::requiereAtencion).toList();
        var conPresupuesto = conAtencion.stream()
                .filter(v -> v.mantenimiento() != null && v.mantenimiento().presupuestoEstimado() != null).toList();
        var presupuesto = conPresupuesto.stream().map(v -> v.mantenimiento().presupuestoEstimado())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ResumenVehiculos(
                activos.size(),
                activos.stream().filter(v -> "operativo".equals(v.estadoOperativo())).count(),
                activos.stream().filter(v -> "requiereMantenimiento".equals(v.estadoOperativo())).count(),
                activos.stream().filter(v -> "detenido".equals(v.estadoOperativo())).count(),
                activos.stream().filter(v -> !ReglasInicio.ESTADOS_VEHICULO.contains(v.estadoOperativo())).count(),
                conAtencion.size(), presupuesto, conAtencion.size() - conPresupuesto.size());
    }

    /** Itinerarios vigentes del vehículo, del más reciente al más antiguo. */
    List<ItinerarioResponse> itinerariosDeVehiculo(String vehiculoId) {
        return ctx.datos.itinerarios().stream()
                .filter(i -> Objects.equals(i.vehiculoId(), vehiculoId) && i.anulacion() == null)
                .sorted(Comparator.comparing(ItinerarioResponse::fecha).reversed())
                .toList();
    }

    /** El consumo declarado se deriva del registro de combustible vigente del recorrido. */
    private BigDecimal consumoDeclarado(String itinerarioId) {
        return ctx.datos.combustible().stream()
                .filter(r -> r.anulacion() == null && "consumo".equals(r.tipo()) && Objects.equals(r.itinerarioId(), itinerarioId))
                .map(r -> r.cantidad())
                .findFirst().orElse(null);
    }

    /**
     * Evalúa un itinerario sin concluir irregularidades. Si falta distancia, rendimiento o consumo declarado, la comparación
     * no es posible y se informa qué falta. Las cargas al vehículo no intervienen: cargar no equivale a consumir.
     */
    Recorrido evaluar(ItinerarioResponse it, VehiculoResponse v) {
        var rendimiento = v == null ? null : v.rendimientoKmL();
        var realizado = it.realizado();
        var km = realizado == null ? null : realizado.km();
        var consumo = consumoDeclarado(it.id());
        var faltantes = new ArrayList<String>();
        if (realizado == null) faltantes.add("ejecución del recorrido");
        else if (km == null) faltantes.add("distancia realizada");
        if (!(rendimiento != null && rendimiento.signum() > 0)) faltantes.add("rendimiento de referencia");
        if (realizado != null && consumo == null) faltantes.add("consumo declarado");

        boolean hayEstimado = km != null && rendimiento != null && rendimiento.signum() != 0;
        var estado = "no_comparable";
        if (realizado == null) estado = "solo_previsto";
        else if (hayEstimado && consumo != null) estado = "comparable";
        return new Recorrido(it, v, estado, faltantes);
    }

    /** Recorridos evaluados de los vehículos vigentes del ámbito. */
    List<Recorrido> recorridos() {
        var lista = new ArrayList<Recorrido>();
        for (var v : ctx.vehiculosEnAmbito()) {
            for (var it : itinerariosDeVehiculo(v.id())) lista.add(evaluar(it, v));
        }
        return lista;
    }
}
