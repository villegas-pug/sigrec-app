package pe.gob.inabif.sigrec.inicio.calculo;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import pe.gob.inabif.sigrec.servicio.dtos.ServicioResponse;

/**
 * SPEC 044. Servicios básicos y pagos (espejo de {@code frontend/src/services/servicios.js}): celdas por período,
 * interrupciones abiertas, renovaciones y problemas recurrentes.
 */
final class ServiciosCalculo {
    /** {@code estado}: pagado, pendiente, sin_info o por_venir. */
    record Celda(int numero, String estado, LocalDate vence) {}

    /** Aviso de un servicio. {@code clase}: pendiente_vence, pendiente_sin_fecha, sin_info, interrupcion, renovacion_vencida o renovacion_proxima. */
    record Aviso(String clase, ServicioResponse servicio, List<Celda> celdas, LocalDate fecha, Integer dias) {}

    record Resumen(long pendientes, long interrupciones, long sinInfo, long renovaciones, long recurrentes) {}

    private final Contexto ctx;

    ServiciosCalculo(Contexto ctx) {
        this.ctx = ctx;
    }

    List<ServicioResponse> serviciosDeCar(String carId) {
        return ctx.datos.servicios().stream().filter(s -> s.anulacion() == null && Objects.equals(s.carId(), carId)).toList();
    }

    /**
     * Celdas de un servicio en un año. Sin registro y con el período ya cerrado a la fecha de corte: «sin información»,
     * no pendiente. El vencimiento solo existe si el pendiente informado trae fecha.
     */
    List<Celda> celdasDelServicio(ServicioResponse servicio, int anio) {
        var cantidad = ReglasInicio.PERIODOS_POR_ANIO.get(servicio.periodicidad());
        if (cantidad == null) return List.of();
        int mesesPorPeriodo = 12 / cantidad;
        var datos = servicio.periodos() == null ? null : servicio.periodos().get(anio);
        var celdas = new ArrayList<Celda>();
        for (int numero = 1; numero <= cantidad; numero++) {
            int mesFin = numero * mesesPorPeriodo;
            boolean cerrado = anio < ctx.hoy.getYear() || (anio == ctx.hoy.getYear() && mesFin <= ctx.hoy.getMonthValue());
            final int n = numero;
            var pendiente = datos == null || datos.pendientes() == null ? null
                    : datos.pendientes().stream().filter(p -> p.numero() == n).findFirst().orElse(null);
            var estado = "por_venir";
            if (datos != null && datos.pagados() != null && datos.pagados().contains(numero)) estado = "pagado";
            else if (pendiente != null) estado = "pendiente";
            else if (cerrado) estado = "sin_info";
            celdas.add(new Celda(numero, estado, pendiente == null ? null : pendiente.vence()));
        }
        return celdas;
    }

    /** Una interrupción sigue abierta si es el último hecho de suministro vigente; un pago no la cierra. */
    ServicioResponse.Hecho interrupcionAbierta(ServicioResponse servicio) {
        var suministro = hechosVigentes(servicio).stream()
                .filter(h -> "interrupcion".equals(h.tipo()) || "restablecimiento".equals(h.tipo()))
                .sorted(Comparator.comparing(ServicioResponse.Hecho::fecha))
                .toList();
        if (suministro.isEmpty()) return null;
        var ultimo = suministro.get(suministro.size() - 1);
        return "interrupcion".equals(ultimo.tipo()) ? ultimo : null;
    }

    private static List<ServicioResponse.Hecho> hechosVigentes(ServicioResponse servicio) {
        return servicio.hechos() == null ? List.of() : servicio.hechos().stream().filter(h -> h.anulacion() == null).toList();
    }

    List<Aviso> avisosDeServicios(List<ServicioResponse> servicios, int anio) {
        var avisos = new ArrayList<Aviso>();
        for (var servicio : servicios) {
            var celdas = celdasDelServicio(servicio, anio);
            for (var celda : celdas) {
                if (celda.estado().equals("pendiente")) {
                    avisos.add(new Aviso(celda.vence() != null ? "pendiente_vence" : "pendiente_sin_fecha", servicio, List.of(celda), null, null));
                }
            }
            var sinInfo = celdas.stream().filter(c -> c.estado().equals("sin_info")).toList();
            if (!sinInfo.isEmpty()) avisos.add(new Aviso("sin_info", servicio, sinInfo, null, null));
            var interrupcion = interrupcionAbierta(servicio);
            if (interrupcion != null) avisos.add(new Aviso("interrupcion", servicio, List.of(), interrupcion.fecha(), null));
            var renovacion = servicio.renovacion() == null ? null : servicio.renovacion().fecha();
            if (renovacion != null) {
                int dias = ReglasInicio.dias(ctx.hoy, renovacion);
                if (dias < 0) avisos.add(new Aviso("renovacion_vencida", servicio, List.of(), renovacion, dias));
                else if (dias <= ReglasInicio.DIAS_AVISO_RENOVACION) avisos.add(new Aviso("renovacion_proxima", servicio, List.of(), renovacion, dias));
            }
        }
        return avisos;
    }

    /**
     * Interrupciones vigentes de los últimos {@link ReglasInicio#MESES_RECURRENCIA} meses hasta hoy (inclusive; las de fecha futura
     * no cuentan). Un servicio es recurrente al alcanzar el umbral. Se deriva de los hechos: no es un dato que se capture.
     */
    int interrupcionesRecientes(ServicioResponse servicio) {
        var desde = ctx.hoy.minusMonths(ReglasInicio.MESES_RECURRENCIA);
        return (int) hechosVigentes(servicio).stream()
                .filter(h -> "interrupcion".equals(h.tipo()) && h.fecha().isAfter(desde) && !h.fecha().isAfter(ctx.hoy))
                .count();
    }

    boolean recurrente(ServicioResponse servicio) {
        return interrupcionesRecientes(servicio) >= ReglasInicio.UMBRAL_RECURRENCIA;
    }

    Resumen resumirDeCar(String carId, int anio) {
        var servicios = serviciosDeCar(carId);
        var avisos = avisosDeServicios(servicios, anio);
        return new Resumen(
                avisos.stream().filter(a -> a.clase().startsWith("pendiente")).count(),
                avisos.stream().filter(a -> a.clase().equals("interrupcion")).count(),
                avisos.stream().filter(a -> a.clase().equals("sin_info")).mapToLong(a -> a.celdas().size()).sum(),
                avisos.stream().filter(a -> a.clase().startsWith("renovacion")).count(),
                servicios.stream().filter(this::recurrente).count());
    }
}
