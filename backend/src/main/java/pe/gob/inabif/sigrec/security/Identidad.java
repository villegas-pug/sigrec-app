package pe.gob.inabif.sigrec.security;

import java.util.Locale;

// SPEC 039: la identidad proviene de la intranet; ya no existen cuentas con contraseña.
public final class Identidad {
    public static final String INTRANET = "INTRANET";

    private Identidad() {}

    public static String login(String value) { return value.strip().toLowerCase(Locale.ROOT); }
}
