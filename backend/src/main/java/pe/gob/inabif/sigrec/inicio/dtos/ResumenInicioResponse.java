package pe.gob.inabif.sigrec.inicio.dtos;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * SPEC 044. Indicadores, situación por centro y avisos de Inicio, calculados en el backend. Son datos, no textos: la SPA
 * conserva la presentación (chips, enlaces, textos de los avisos) y solo recibe lo que las reglas deciden.
 *
 * <p>{@code filas} tiene la forma de {@code resumenPorCentro} de la SPA, de modo que {@code totalizarSituacion} se aplica igual.
 */
public record ResumenInicioResponse(
        List<Fila> filas,
        Jerarquia jerarquia,
        Recorridos recorridos,
        Avisos avisos) {

    public record Fila(
            Car car, Necesidades necesidades, String estadoGeneral, int ambientesCriticos, int modulosCriticos,
            int elementosCriticosInmueble, int elementosCriticos, long novedadesAbiertas,
            long bienesActivos, long bienesMalos, long registrosActivos, long verificados,
            Controles controles, String fumigacion, Vehiculos vehiculos, Servicios servicios) {}

    /** Mantiene la forma {@code car.inmueble.condicion} que usa la SPA. */
    public record Car(String id, String nombre, Inmueble inmueble) {}

    public record Inmueble(String condicion) {}

    public record Necesidades(long cantidad, BigDecimal importeConocido, long sinValorar, long infraestructura, long atendidas) {}

    public record Controles(long vencidos, long porVencer, long extintoresFaltantes) {}

    public record Vehiculos(long total, long operativos, long requierenMantenimiento, long detenidos, long sinInformar,
                            long requierenAtencion, BigDecimal presupuestoEstimado, long sinEstimar) {}

    public record Servicios(long pendientes, long interrupciones, long sinInfo, long renovaciones, long recurrentes) {}

    public record Jerarquia(long centros, long modulos, long ambientes) {}

    public record Recorridos(long total, long noComparables) {}

    public record Avisos(List<Aviso> ahora, List<Aviso> proximos) {}

    /**
     * Aviso sin texto. {@code clase} identifica la regla y {@code datos} trae lo que la SPA necesita para redactarlo y
     * enlazarlo; solo se incluyen los valores presentes. {@code dias} solo aparece en los avisos de «próximos».
     */
    public record Aviso(String id, String categoria, String carId, String horizonte, Integer dias, String tono, String clase,
                        String tipoAviso, Map<String, Object> datos) {}
}
