package pe.gob.inabif.sigrec.vehiculo.dtos;

import java.math.BigDecimal;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record VehiculoResponse(String id, String carId, String tipo, String placa, String chofer, String combustible,
        BigDecimal rendimientoKmL, String estadoOperativo, VehiculoDatos.Mantenimiento mantenimiento, Sello anulacion) {}
