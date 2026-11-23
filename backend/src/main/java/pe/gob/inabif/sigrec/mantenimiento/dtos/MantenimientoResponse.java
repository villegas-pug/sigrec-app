package pe.gob.inabif.sigrec.mantenimiento.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoResponse;

public record MantenimientoResponse(String id, String carId, String bienId, String vehiculoId, String tipo,
        LocalDate fecha, LocalDate proxima, String detalle, BigDecimal importe, String informadoPor, LocalDate registradoEl,
        Sello anulacion) {
    public record Alta(List<MantenimientoResponse> registros, VehiculoResponse vehiculo) {}
}
