package pe.gob.inabif.sigrec.inicio.calculo;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * SPEC 044. Umbrales y constantes de las reglas de Inicio. Son el espejo de {@code frontend/src/config/reglas.js} y de
 * las constantes de {@code frontend/src/config/catalogos.js}: si cambian allí, cambian aquí.
 */
final class ReglasInicio {
    static final int DIAS_POR_VENCER = 30;
    static final int MESES_RECURRENCIA = 12;
    static final int UMBRAL_RECURRENCIA = 3;
    static final int DIAS_AVISO_RENOVACION = 60;
    static final int DIAS_PROXIMOS = 60;

    static final Set<String> CONDICIONES = conjunto("bueno", "regular", "malo", "inservible");
    static final Set<String> CONDICIONES_CRITICAS = conjunto("malo", "inservible");
    static final Set<String> INCIDENTES = conjunto("dano", "robo", "incendio");
    static final Set<String> TIPOS_NOVEDAD = conjunto("dano", "incendio", "humedad", "instalaciones", "estructura", "otro");
    static final String TIPO_EXTINTOR = "extintor";
    static final Set<String> ESTADOS_VEHICULO = conjunto("operativo", "requiereMantenimiento", "detenido");
    static final Set<String> ESTADOS_VEHICULO_CON_ATENCION = conjunto("requiereMantenimiento", "detenido");
    static final Map<String, Integer> PERIODOS_POR_ANIO = tabla(
            "mensual", 12, "bimestral", 6, "trimestral", 4, "cuatrimestral", 3, "semestral", 2, "anual", 1);
    /** Elementos base que el cliente conserva aunque el catálogo del backend no los liste. */
    static final List<String> ELEMENTOS_BASE_PREDETERMINADOS = List.of(
            "puertas", "ventanas", "pintura", "pisos", "techo", "estructura", "electricas", "sanitarias");
    static final Map<String, Integer> PESO_TONO = tabla("da", 0, "wa", 1, "in", 2, "si", 3);

    private ReglasInicio() {}

    /** Conjunto que admite consultar valores nulos ({@code Set.of} lanzaría NullPointerException). */
    private static Set<String> conjunto(String... valores) {
        return Collections.unmodifiableSet(new HashSet<>(Arrays.asList(valores)));
    }

    private static Map<String, Integer> tabla(Object... pares) {
        var mapa = new HashMap<String, Integer>();
        for (int i = 0; i < pares.length; i += 2) mapa.put((String) pares[i], (Integer) pares[i + 1]);
        return Collections.unmodifiableMap(mapa);
    }

    /** Días de {@code desde} a {@code hasta}; negativo si {@code hasta} es anterior. */
    static int dias(LocalDate desde, LocalDate hasta) {
        return (int) ChronoUnit.DAYS.between(desde, hasta);
    }
}
