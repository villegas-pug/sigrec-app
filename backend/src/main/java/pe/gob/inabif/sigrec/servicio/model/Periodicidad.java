package pe.gob.inabif.sigrec.servicio.model;

import java.util.Map;

public final class Periodicidad {
    private static final Map<String, Integer> MESES = Map.of("mensual", 1, "bimestral", 2, "trimestral", 3,
            "cuatrimestral", 4, "semestral", 6, "anual", 12);
    private static final String[] CORTOS = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"};
    private static final String[] ORDINALES = {"1.er", "2.º", "3.er", "4.º"};

    private Periodicidad() {}

    public static int meses(String codigo) { return MESES.get(codigo); }

    public static String codigo(int meses) {
        return MESES.entrySet().stream().filter(e -> e.getValue() == meses).findFirst().orElseThrow().getKey();
    }

    public static String etiqueta(Periodo periodo) {
        int numero = periodo.getNumero();
        return switch (periodo.getMeses()) {
            case 1 -> CORTOS[numero - 1];
            case 2 -> CORTOS[numero * 2 - 2] + "–" + CORTOS[numero * 2 - 1];
            case 3 -> ORDINALES[numero - 1] + " trimestre";
            case 4 -> ORDINALES[numero - 1] + " cuatrimestre";
            case 6 -> ORDINALES[numero - 1] + " semestre";
            default -> "Anual";
        } + " " + periodo.getAnio();
    }
}
