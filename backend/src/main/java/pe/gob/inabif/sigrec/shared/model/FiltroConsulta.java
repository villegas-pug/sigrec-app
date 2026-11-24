package pe.gob.inabif.sigrec.shared.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * SPEC 052: filtros de cabecera que reciben las colecciones. Año y mes acotan la fecha de registro
 * ({@code FEC_REGISTRA}, hora de Lima) del registro principal de cada pantalla en un rango semiabierto.
 * {@code centros}, si no es nulo, limita además los registros a esos centros (p. ej. los registrados en un periodo).
 */
public record FiltroConsulta(String centro, Integer anio, Integer mes, Set<String> centros) {
    public static final FiltroConsulta TODO = new FiltroConsulta(null, null, null);

    public FiltroConsulta {
        centro = centro == null || centro.isBlank() ? null : centro.strip();
        if ((centro != null && !centro.matches("[A-Z0-9]{3}"))
                || (mes != null && (anio == null || mes < 1 || mes > 12))
                || (anio != null && (anio < 1900 || anio > 9999))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revise el centro, el año y el mes de los filtros.");
        }
        centros = centros == null ? null : Set.copyOf(centros);
    }

    public FiltroConsulta(String centro, Integer anio, Integer mes) { this(centro, anio, mes, null); }

    /** El mismo centro sin periodo, limitado a los centros indicados. */
    public FiltroConsulta soloCentros(Set<String> codigos) { return new FiltroConsulta(centro, null, null, codigos); }

    public boolean porPeriodo() { return anio != null; }

    /** Inicio del periodo, incluido; {@code null} sin filtro de año. */
    public LocalDateTime desde() {
        return anio == null ? null : LocalDate.of(anio, mes == null ? 1 : mes, 1).atStartOfDay();
    }

    /** Fin del periodo, excluido; {@code null} sin filtro de año. */
    public LocalDateTime hasta() {
        if (anio == null) return null;
        var inicio = LocalDate.of(anio, mes == null ? 1 : mes, 1);
        return (mes == null ? inicio.plusYears(1) : inicio.plusMonths(1)).atStartOfDay();
    }

    /** ¿El registro pertenece a los centros filtrados y su fecha de registro cae en el periodo? */
    public boolean admite(String codigoCentro, LocalDateTime registradoEl) {
        return deCentro(codigoCentro) && incluye(registradoEl);
    }

    /** ¿El registro pertenece a los centros filtrados? Sin centro, siempre. */
    public boolean deCentro(String codigoCentro) {
        return (centro == null || centro.equals(codigoCentro)) && (centros == null || centros.contains(codigoCentro));
    }

    /** ¿La fecha de registro cae en el periodo? Sin filtro de año, siempre. */
    public boolean incluye(LocalDateTime registradoEl) {
        if (anio == null) return true;
        return registradoEl != null && !registradoEl.isBefore(desde()) && registradoEl.isBefore(hasta());
    }
}
