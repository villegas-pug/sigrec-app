package pe.gob.inabif.sigrec.security;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Identidad que la SPA recibió de la intranet y reenvía en cada llamada (SPEC 039).
 * No se verifica firma: es el único punto donde añadirla cuando la intranet entregue la clave.
 */
@Component
public class IdentidadIntranet {
    public static final String CABECERA_ID = "X-Usuario-Id";
    public static final String CABECERA_NOMBRE = "X-Usuario-Nombre";

    public record Datos(String sujeto, String nombre) {}

    public Optional<Datos> actual() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes atributos)) return Optional.empty();
        var request = atributos.getRequest();
        var id = request.getHeader(CABECERA_ID);
        if (id == null || id.isBlank() || id.strip().length() > 40) return Optional.empty();
        var sujeto = Identidad.login(id);
        var nombre = request.getHeader(CABECERA_NOMBRE);
        return Optional.of(new Datos(sujeto, nombreLegible(nombre, sujeto)));
    }

    private static String nombreLegible(String codificado, String respaldo) {
        if (codificado == null || codificado.isBlank()) return respaldo;
        try {
            var nombre = URLDecoder.decode(codificado, StandardCharsets.UTF_8).strip();
            return nombre.isEmpty() ? respaldo : nombre.substring(0, Math.min(nombre.length(), 180));
        } catch (IllegalArgumentException error) {
            return respaldo;
        }
    }
}
