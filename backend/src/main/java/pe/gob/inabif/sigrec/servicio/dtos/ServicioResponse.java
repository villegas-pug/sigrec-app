package pe.gob.inabif.sigrec.servicio.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ServicioResponse(String id, String carId, String tipo, String periodicidad, String inicio,
        ServicioDatos.Renovacion renovacion, String proveedor, String suministro, String contratacion,
        String observaciones, ServicioDatos.Contacto contacto, Map<Integer, Anio> periodos,
        List<Hecho> hechos, Sello anulacion) {
    public record Anio(List<Integer> pagados, List<Pendiente> pendientes, Map<Integer, UpdatePeriodoRequest.Pago> pagos) {}
    public record Pendiente(int numero, LocalDate vence, String motivo, String detalle) {}
    public record Hecho(String id, LocalDate fecha, String tipo, String detalle, String informadoPor, Sello anulacion) {}
}
