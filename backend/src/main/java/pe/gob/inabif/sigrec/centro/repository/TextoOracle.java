package pe.gob.inabif.sigrec.centro.repository;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

/** Expresiones Oracle compartidas por las búsquedas de texto (SPEC 045, 052, 054). */
final class TextoOracle {
    // SPEC 054: cualquier carácter que no sea letra o dígito (espacios, NBSP, comas, puntos…) separa palabras.
    private static final Pattern SEPARADOR_PALABRAS = Pattern.compile("[^\\p{L}\\p{N}]+");

    private TextoOracle() {}

    /**
     * Palabras del término de búsqueda en NFC, sin separadores ni vacíos (SPEC 054).
     * Cada palabra se busca como subcadena del nombre, así que el orden y la puntuación del nombre no importan.
     */
    static List<String> palabras(String texto) {
        return SEPARADOR_PALABRAS.splitAsStream(Normalizer.normalize(texto, Normalizer.Form.NFC))
                .filter(palabra -> !palabra.isEmpty())
                .toList();
    }

    /** Mayúsculas sin tildes. La Ñ sigue siendo una letra distinta. */
    static String sinTildes(String expresion) {
        return "TRANSLATE(UPPER(COMPOSE(" + expresion + ")), "
                + "UNISTR('\\00C1\\00C9\\00CD\\00D3\\00DA\\00DC'), N'AEIOUU')";
    }

    /** Valida y antepone el esquema configurado a una tabla. */
    static String tabla(String esquema, String nombre) {
        if (!esquema.isEmpty() && !esquema.matches("[A-Za-z][A-Za-z0-9_$#]*")) {
            throw new IllegalArgumentException("El esquema Oracle de SIGREC no es un identificador válido.");
        }
        return (esquema.isEmpty() ? "" : esquema + ".") + nombre;
    }
}
