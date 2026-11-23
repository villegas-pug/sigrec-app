package pe.gob.inabif.sigrec.bien.model;

import java.time.*;
import java.time.format.DateTimeParseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record FechaAdquisicion(LocalDate fecha, String precision) {
    public static FechaAdquisicion interpretar(String texto) {
        if (texto == null || texto.isBlank()) return new FechaAdquisicion(null, null);
        try {
            if (texto.length() == 4) return new FechaAdquisicion(Year.parse(texto).atDay(1), "ANIO");
            return new FechaAdquisicion(YearMonth.parse(texto).atDay(1), "MES");
        } catch (DateTimeParseException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique el año o mes de adquisición.");
        }
    }

    public static String mostrar(LocalDate fecha, String precision) {
        if (fecha == null) return null;
        return "ANIO".equals(precision) ? Year.from(fecha).toString() : YearMonth.from(fecha).toString();
    }
}
