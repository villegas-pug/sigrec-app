package pe.gob.inabif.sigrec.foto.dtos;

import java.time.LocalDate;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record FotoResponse(String id, String carId, String ambienteId, String bienId, String titulo,
        LocalDate fecha, String nota, String url, String nombreArchivo, String registradoPor, Sello anulacion) {
    public record Contenido(String tipo, byte[] bytes) {}
}
