package pe.gob.inabif.sigrec.centro.repository;

/** Expresiones Oracle compartidas por las búsquedas de texto (SPEC 045, 052). */
final class TextoOracle {
    private TextoOracle() {}

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
