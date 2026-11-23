package pe.gob.inabif.sigrec.security;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class Identidad {
    public static final String LOCAL = "LOCAL";

    private Identidad() {}

    public static String login(String value) { return value.strip().toLowerCase(Locale.ROOT); }

    public static boolean longitudPasswordValida(String password) {
        return password.length() >= 12 && password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }

    public static void validarPassword(String password) {
        if (!longitudPasswordValida(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 12 caracteres y hasta 72 bytes.");
        }
    }
}
