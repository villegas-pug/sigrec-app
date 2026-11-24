package pe.gob.inabif.sigrec.inicio.calculo;

import java.util.List;
import java.util.Map;

/**
 * SPEC 044. Vista tipada de un evento del inventario (los eventos viajan como mapas sin tipar). Solo conserva lo que
 * usan las reglas de Inicio. El orden de la lista de eventos se respeta tal cual llega.
 */
record Hecho(String id, String tipo, String fecha, boolean novedad, boolean cargaInicial, boolean anulado,
             String ambienteId, String carId, List<String> bienIds, String origenTipo, boolean requiereEvaluacion,
             boolean atendida, String bienAnteriorId, String titulo, Map<String, Evaluacion> evaluaciones) {

    record Evaluacion(boolean requiereReposicion, Integer unidades) {}

    @SuppressWarnings("unchecked")
    static Hecho desde(Map<String, Object> m) {
        var origen = m.get("origen") instanceof Map<?, ?> o ? (Map<String, Object>) o : Map.<String, Object>of();
        var evaluaciones = new java.util.LinkedHashMap<String, Evaluacion>();
        if (m.get("evaluaciones") instanceof Map<?, ?> e) {
            e.forEach((bien, valor) -> {
                var v = (Map<String, Object>) valor;
                var unidades = v.get("unidades") instanceof Number n ? Integer.valueOf(n.intValue()) : null;
                evaluaciones.put(String.valueOf(bien), new Evaluacion(Boolean.TRUE.equals(v.get("requiereReposicion")), unidades));
            });
        }
        return new Hecho(
                texto(m.get("id")), texto(m.get("tipo")), texto(m.get("fecha")),
                "novedad".equals(m.get("clase")), Boolean.TRUE.equals(m.get("cargaInicial")), m.get("anulacion") != null,
                texto(m.get("ambienteId")), texto(m.get("carId")),
                m.get("bienIds") instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of(),
                texto(origen.get("tipo")), Boolean.TRUE.equals(m.get("requiereEvaluacion")), m.get("atencion") != null,
                texto(m.get("bienAnteriorId")), texto(m.get("titulo")), evaluaciones);
    }

    private static String texto(Object valor) {
        return valor == null ? null : String.valueOf(valor);
    }

    boolean vigente() {
        return !anulado;
    }

    /** Año del hecho; las fechas son ISO ({@code AAAA-MM-DD}). */
    int anio() {
        return Integer.parseInt(fecha.substring(0, 4));
    }

    /** SPEC 032: la decisión de reposición es individual por bien afectado. */
    boolean requiereReposicion(String bienId) {
        var evaluacion = evaluaciones.get(bienId);
        return evaluacion != null && evaluacion.requiereReposicion();
    }

    boolean esIncidencia() {
        return ReglasInicio.INCIDENTES.contains(tipo)
                || (("centro".equals(origenTipo) || "ambiente".equals(origenTipo)) && ReglasInicio.TIPOS_NOVEDAD.contains(tipo));
    }

    /** Sin cantidad informada, el hecho afecta a todas las unidades del bien. */
    int unidadesAfectadas(String bienId, Integer cantidadBien) {
        var evaluacion = evaluaciones.get(bienId);
        if (evaluacion != null && evaluacion.unidades() != null) return evaluacion.unidades();
        return cantidadBien == null ? 1 : cantidadBien;
    }
}
