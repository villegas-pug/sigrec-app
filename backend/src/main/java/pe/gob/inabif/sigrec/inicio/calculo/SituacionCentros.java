package pe.gob.inabif.sigrec.inicio.calculo;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Car;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Controles;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Fila;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Inmueble;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Necesidades;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Servicios;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Vehiculos;

/**
 * SPEC 044. Una fila por centro con necesidades, infraestructura, bienes, controles, vehículos y servicios (espejo de
 * {@code resumenPorCentro} en {@code frontend/src/services/situacion.js}). Reutiliza las reglas de cada módulo.
 */
final class SituacionCentros {
    private final Contexto ctx;
    private final NecesidadesCalculo.Resultado necesidades;
    private final ControlesCalculo controles;
    private final ServiciosCalculo servicios;
    private final Movilidad movilidad;
    private final int anioServicios;

    SituacionCentros(Contexto ctx, NecesidadesCalculo.Resultado necesidades, ControlesCalculo controles,
                     ServiciosCalculo servicios, Movilidad movilidad, int anioServicios) {
        this.ctx = ctx;
        this.necesidades = necesidades;
        this.controles = controles;
        this.servicios = servicios;
        this.movilidad = movilidad;
        this.anioServicios = anioServicios;
    }

    List<Fila> filas() {
        return ctx.carsVigentes.stream().map(this::fila).toList();
    }

    private Fila fila(CentroResponse car) {
        var ambientes = ctx.ambientesDeCar(car.id());
        var modulos = ctx.modulosDeCar(car.id());
        var idsAmbientes = new HashSet<String>();
        ambientes.forEach(a -> idsAmbientes.add(a.id()));
        var activos = ctx.datos.inventario().bienes().stream()
                .filter(b -> ctx.activo(b) && idsAmbientes.contains(b.ambienteId())).toList();

        // Unidades por condición: bienes sin condición conocida cuentan como «sin dato». Los componentes cuentan como bienes.
        long malos = 0;
        long unidades = 0;
        for (var b : activos) {
            long cantidad = b.cantidad() == null ? 1 : b.cantidad();
            unidades += cantidad;
            if (ReglasInicio.CONDICIONES_CRITICAS.contains(b.condicion())) malos += cantidad;
        }

        int criticosInmueble = elementosCriticos(filasDeElementos(car.id(), null, null), true);
        int criticos = criticosInmueble
                + modulos.stream().mapToInt(m -> elementosCriticos(filasDeElementos(null, m.id(), null), true)).sum()
                + ambientes.stream().mapToInt(a -> elementosCriticos(filasDeElementos(null, null, a.id()), false)).sum();
        long novedades = ambientes.stream()
                .mapToLong(a -> ctx.novedadesDe(a.id()).stream().filter(n -> n.vigente() && !n.atendida()).count()).sum();

        var pendientes = necesidades.pendientes().stream().filter(p -> Objects.equals(p.carId(), car.id())).toList();
        var valoradas = pendientes.stream().filter(p -> p.importe() != null).toList();
        var importe = valoradas.stream().map(NecesidadesCalculo.Pendiente::importe).reduce(BigDecimal.ZERO, BigDecimal::add);
        var resumenControles = ControlesCalculo.resumir(controles.pendientes(List.of(car.id())));
        var v = movilidad.resumirDeCar(car.id());
        var s = servicios.resumirDeCar(car.id(), anioServicios);
        var inmueble = car.inmueble();

        return new Fila(
                new Car(car.id(), car.nombre(), inmueble == null ? null : new Inmueble(inmueble.condicion())),
                new Necesidades(
                        pendientes.size(), importe, pendientes.size() - valoradas.size(),
                        necesidades.infraestructura().stream().filter(i -> Objects.equals(i.carId(), car.id())).count(),
                        NecesidadesCalculo.delCar(necesidades.carsAtendidas(), car.id())),
                inmueble == null || inmueble.construccion() == null ? null : inmueble.construccion().estado(),
                (int) ambientes.stream().filter(a -> ReglasInicio.CONDICIONES_CRITICAS.contains(a.condicion())).count(),
                (int) modulos.stream().filter(m -> ReglasInicio.CONDICIONES_CRITICAS.contains(m.condicion())).count(),
                criticosInmueble, criticos, novedades,
                unidades, malos, activos.size(), activos.stream().filter(ctx::verificado).count(),
                new Controles(resumenControles.vencidos(), resumenControles.porVencer(), resumenControles.extintoresFaltantes()),
                controles.fumigacionDeCentro(car.id()),
                new Vehiculos(v.total(), v.operativos(), v.requierenMantenimiento(), v.detenidos(), v.sinInformar(),
                        v.requierenAtencion(), v.presupuestoEstimado(), v.sinEstimar()),
                new Servicios(s.pendientes(), s.interrupciones(), s.sinInfo(), s.renovaciones(), s.recurrentes()));
    }

    /** Filas de elementos evaluados de un centro, un módulo o un ambiente (arco exclusivo). */
    private List<ElementoResponse> filasDeElementos(String carId, String moduloId, String ambienteId) {
        return ctx.datos.jerarquia().elementos().stream().filter(e ->
                carId != null ? Objects.equals(e.carId(), carId)
                        : moduloId != null ? Objects.equals(e.moduloId(), moduloId) : Objects.equals(e.ambienteId(), ambienteId)).toList();
    }

    /**
     * Elementos evaluados en condición mala o inservible. Se consideran los elementos base y, si {@code conAdicionales},
     * los que el centro o el módulo agregó (los de un ambiente no admiten adicionales).
     */
    private int elementosCriticos(List<ElementoResponse> filas, boolean conAdicionales) {
        var estado = new HashMap<String, String>();
        for (var f : filas) {
            if (f.condicion() != null && !f.condicion().isEmpty()) estado.put(f.clave(), f.condicion());
        }
        var claves = new ArrayList<String>(ctx.elementosBase);
        if (conAdicionales) {
            for (var f : filas) if (f.nombre() != null && !f.nombre().isEmpty()) claves.add(f.clave());
        }
        return (int) claves.stream().filter(k -> ReglasInicio.CONDICIONES_CRITICAS.contains(estado.get(k))).count();
    }
}
