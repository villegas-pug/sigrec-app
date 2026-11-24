package pe.gob.inabif.sigrec.inicio.calculo;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Aviso;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse.Avisos;

/**
 * SPEC 044. Selección de los avisos de «Atención requerida» (espejo de {@code frontend/src/services/atencion.js}).
 * Decide qué avisos existen, su horizonte, tono y orden; el texto, los enlaces y las acciones los redacta la SPA a partir
 * de {@code clase} y {@code datos}.
 *
 * <p>Diferencia deliberada con la regla anterior: el aviso de «problema recurrente» siempre usa el nombre del tipo de
 * servicio, no el código cuando el servicio no tenía otros avisos.
 */
final class AvisosCalculo {
    private final Contexto ctx;
    private final NecesidadesCalculo.Resultado necesidades;
    private final ControlesCalculo controles;
    private final ServiciosCalculo servicios;
    private final Movilidad movilidad;
    private final int anioServicios;

    AvisosCalculo(Contexto ctx, NecesidadesCalculo.Resultado necesidades, ControlesCalculo controles, ServiciosCalculo servicios,
                  Movilidad movilidad, int anioServicios) {
        this.ctx = ctx;
        this.necesidades = necesidades;
        this.controles = controles;
        this.servicios = servicios;
        this.movilidad = movilidad;
        this.anioServicios = anioServicios;
    }

    /** «Ahora»: vencido, pendiente o abierto, ordenado por gravedad. «Próximos»: vence en el horizonte, ordenado por fecha. */
    Avisos calcular() {
        var carIds = ctx.idsCarsVigentes();
        var todos = new ArrayList<Aviso>();
        todos.addAll(avisosServicios());
        todos.addAll(avisosControles(carIds));
        todos.addAll(avisosVehiculos(carIds));
        todos.addAll(avisosBienes());
        todos.addAll(avisosRecorridos());
        var ahora = new ArrayList<>(todos.stream().filter(a -> a.horizonte().equals("ahora")).toList());
        ahora.sort(Comparator.comparingInt(a -> ReglasInicio.PESO_TONO.get(a.tono())));
        var proximos = new ArrayList<>(todos.stream().filter(a -> a.horizonte().equals("proximo")).toList());
        proximos.sort(Comparator.comparingInt(Aviso::dias));
        return new Avisos(ahora, proximos);
    }

    /** Pares nombre-valor; los valores nulos no se incluyen. */
    private static LinkedHashMap<String, Object> datos(Object... pares) {
        var mapa = new LinkedHashMap<String, Object>();
        for (int i = 0; i < pares.length; i += 2) {
            if (pares[i + 1] != null) mapa.put((String) pares[i], pares[i + 1]);
        }
        return mapa;
    }

    private List<Aviso> avisosServicios() {
        var lista = new ArrayList<Aviso>();
        var todos = ctx.carsVigentes.stream().flatMap(c -> servicios.serviciosDeCar(c.id()).stream()).toList();
        for (var a : servicios.avisosDeServicios(todos, anioServicios)) {
            var s = a.servicio();
            var celda = a.celdas().isEmpty() ? null : a.celdas().get(0);
            var id = s.id() + "-" + a.clase() + "-" + (celda == null ? 0 : celda.numero());
            switch (a.clase()) {
                case "pendiente_vence" -> {
                    int dias = ReglasInicio.dias(ctx.hoy, celda.vence());
                    var d = datos("servicioId", s.id(), "tipoServicio", s.tipo(), "periodicidad", s.periodicidad(), "anio", anioServicios,
                            "numero", celda.numero(), "vence", celda.vence().toString(), "dias", dias);
                    // Vencido: va a «Ahora». Con vencimiento dentro del horizonte: calendario de «Próximos». Más lejano: sigue en «Ahora».
                    if (dias < 0) lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "da", "pendiente_vencido", null, d));
                    else if (dias <= ReglasInicio.DIAS_PROXIMOS) lista.add(new Aviso(id, "servicios", s.carId(), "proximo", dias, "wa", "pendiente_por_vencer", null, d));
                    else lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "da", "pendiente_con_vencimiento", null, d));
                }
                case "pendiente_sin_fecha" -> lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "wa", "pendiente_sin_fecha", null,
                        datos("servicioId", s.id(), "tipoServicio", s.tipo(), "periodicidad", s.periodicidad(), "anio", anioServicios,
                                "numero", celda.numero())));
                case "sin_info" -> lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "si", "sin_info", null,
                        datos("servicioId", s.id(), "tipoServicio", s.tipo(), "periodicidad", s.periodicidad(), "anio", anioServicios,
                                "numeros", a.celdas().stream().map(ServiciosCalculo.Celda::numero).toList())));
                case "interrupcion" -> lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "wa", "interrupcion_abierta", null,
                        datos("servicioId", s.id(), "tipoServicio", s.tipo(), "fecha", a.fecha().toString())));
                case "renovacion_vencida" -> lista.add(new Aviso(id, "servicios", s.carId(), "ahora", null, "da", "renovacion_vencida", null,
                        datos("servicioId", s.id(), "tipoServicio", s.tipo(), "fecha", a.fecha().toString(), "dias", a.dias())));
                case "renovacion_proxima" -> lista.add(new Aviso(id, "servicios", s.carId(), "proximo", a.dias(), "wa", "renovacion_proxima", null,
                        datos("servicioId", s.id(), "tipoServicio", s.tipo(), "fecha", a.fecha().toString(), "dias", a.dias())));
                default -> { }
            }
        }
        // Problemas recurrentes: se derivan de las interrupciones; no requieren una acción propia.
        for (var s : todos) {
            if (!servicios.recurrente(s)) continue;
            lista.add(new Aviso(s.id() + "-recurrente", "servicios", s.carId(), "ahora", null, "wa", "problema_recurrente", null,
                    datos("servicioId", s.id(), "tipoServicio", s.tipo(), "cantidad", servicios.interrupcionesRecientes(s))));
        }
        return lista;
    }

    private List<Aviso> avisosControles(List<String> carIds) {
        var lista = new ArrayList<Aviso>();
        for (var c : controles.pendientes(carIds)) {
            if (c.clase().equals("faltante")) {
                lista.add(new Aviso("control-" + c.clave(), "seguridad", c.carId(), "ahora", null, "wa", "extintores_faltantes",
                        "extintores_faltantes", datos("faltantes", c.faltantes())));
            } else if (c.clase().equals("vencido")) {
                var m = c.mantenimiento();
                lista.add(new Aviso("control-" + c.clave(), m.vehiculoId() != null ? "movilidad" : "seguridad", c.carId(), "ahora", null,
                        "da", "control_vencido", "control_vencido", datosControl(c.objetivo(), c.proxima().toString(), c.dias(), m)));
            }
            // «Por vencer» va al calendario de próximos vencimientos.
        }
        for (var c : controles.proximos(carIds, ReglasInicio.DIAS_PROXIMOS)) {
            var m = c.mantenimiento();
            boolean porVencer = c.estado().equals("por_vencer");
            var tipoAviso = porVencer ? "control_por_vencer" : "control_programado";
            lista.add(new Aviso("proximo-" + c.clave(), m.vehiculoId() != null ? "movilidad" : "seguridad", c.carId(), "proximo", c.dias(),
                    porVencer ? "wa" : "in", tipoAviso, tipoAviso, datosControl(c.objetivo(), c.proxima().toString(), c.dias(), m)));
        }
        return lista;
    }

    private static LinkedHashMap<String, Object> datosControl(String objetivo, String proxima, int dias,
                                                              pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoResponse m) {
        return datos("mantenimientoId", m.id(), "tipoMantenimiento", m.tipo(), "bienId", m.bienId(), "vehiculoId", m.vehiculoId(),
                "objetivo", objetivo, "proxima", proxima, "dias", dias);
    }

    private List<Aviso> avisosVehiculos(List<String> carIds) {
        var lista = new ArrayList<Aviso>();
        for (var v : ctx.vehiculosEnAmbito()) {
            if (!carIds.contains(v.carId()) || !Movilidad.requiereAtencion(v)) continue;
            var mantenimiento = v.mantenimiento();
            lista.add(new Aviso("vehiculo-" + v.id(), "movilidad", v.carId(), "ahora", null,
                    "detenido".equals(v.estadoOperativo()) ? "da" : "wa", "vehiculo_atencion", null,
                    datos("vehiculoId", v.id(), "tipoVehiculo", v.tipo(), "estadoOperativo", v.estadoOperativo(),
                            "motivo", mantenimiento == null ? null : mantenimiento.motivo(),
                            "presupuesto", mantenimiento == null ? null : mantenimiento.presupuestoEstimado())));
        }
        return lista;
    }

    private List<Aviso> avisosBienes() {
        var lista = new ArrayList<Aviso>();
        for (var e : ctx.eventosRegistrados()) {
            if (!(e.vigente() && e.esIncidencia() && e.bienIds().stream().anyMatch(e::requiereReposicion))) continue;
            var abiertas = necesidades.pendientes().stream()
                    .filter(n -> e.bienIds().contains(n.id()) && e.requiereReposicion(n.id())).toList();
            if (abiertas.isEmpty()) continue;
            var primera = abiertas.get(0);
            var car = ctx.carPorId.get(primera.carId());
            var ubicacion = Contexto.textoUbicacion(car, ctx.moduloPorId.get(primera.moduloId()), ctx.ambientePorId.get(primera.ambienteId()));
            lista.add(new Aviso(e.id(), "bienes", car.id(), "ahora", null, "da", "incidente_reposicion", null,
                    datos("eventoId", e.id(), "tipoEvento", e.tipo(), "titulo", e.titulo(), "fecha", e.fecha(),
                            "cantidad", abiertas.size(), "ubicacion", ubicacion)));
        }
        for (var item : necesidades.infraestructura()) {
            lista.add(new Aviso(item.id(), "bienes", item.carId(), "ahora", null, "in", "infraestructura_evaluacion", null,
                    datos("titulo", item.titulo(), "ubicacion", item.ubicacion(), "esIncidencia", item.esIncidencia(),
                            "ambienteId", item.ambienteId())));
        }
        return lista;
    }

    private List<Aviso> avisosRecorridos() {
        var lista = new ArrayList<Aviso>();
        for (var r : movilidad.recorridos()) {
            if (!r.estado().equals("no_comparable")) continue;
            lista.add(new Aviso(r.itinerario().id(), "movilidad", r.vehiculo().carId(), "ahora", null, "in", "recorrido_insuficiente", null,
                    datos("vehiculoId", r.vehiculo().id(), "itinerarioId", r.itinerario().id(), "faltantes", r.faltantes())));
        }
        return lista;
    }
}
