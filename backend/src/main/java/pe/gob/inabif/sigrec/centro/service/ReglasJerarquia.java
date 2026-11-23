package pe.gob.inabif.sigrec.centro.service;

import java.util.Locale;
import java.util.function.Predicate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ReglasJerarquia {
    private ReglasJerarquia() {}

    public static void exigirVigencia(boolean vigente, String mensaje) {
        if (!vigente) throw error(HttpStatus.CONFLICT, mensaje);
    }

    public static String siguiente(String prefijo, Predicate<String> existe) {
        for (int i = 1; ; i++) {
            var codigo = prefijo + String.format(Locale.ROOT, "%02d", i);
            if (!existe.test(codigo)) return codigo;
        }
    }

    public static ResponseStatusException noDisponible() { return error(HttpStatus.NOT_FOUND, "Registro no disponible."); }
    public static ResponseStatusException error(HttpStatus status, String detalle) { return new ResponseStatusException(status, detalle); }
}
