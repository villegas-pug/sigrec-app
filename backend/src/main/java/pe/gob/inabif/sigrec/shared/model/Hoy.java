package pe.gob.inabif.sigrec.shared.model;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * SPEC 040: «hoy» es la fecha real del sistema en la zona horaria del Perú. Sustituye a la fecha de corte fija de
 * la demostración. El reloj puede reemplazarse en las pruebas.
 */
public final class Hoy {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static volatile Clock reloj = Clock.system(LIMA);

    private Hoy() {}

    public static LocalDate fecha() { return LocalDate.now(reloj); }

    /** Solo para pruebas: fija el reloj. */
    public static void usarReloj(Clock nuevo) { reloj = nuevo; }

    /** Solo para pruebas: vuelve al reloj del sistema. */
    public static void restablecer() { reloj = Clock.system(LIMA); }
}
