package pe.gob.inabif.sigrec.intervencion.dtos;
import java.time.YearMonth;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record IntervencionResponse(String id, String ambienteId, String descripcion, YearMonth fecha, boolean esPintado,
                                  String informadoPor, Sello anulacion) {
    public record Cambio(IntervencionResponse registro, YearMonth ultimoPintado) {}
}
