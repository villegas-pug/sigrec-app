package pe.gob.inabif.sigrec.combustible.mappers;

import java.util.Locale;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.combustible.dtos.*;
import pe.gob.inabif.sigrec.combustible.model.Combustible;

@Mapper(config = BaseMapStructConfig.class)
public interface CombustibleResponseMapper {
    default CombustibleResponse toResponse(Combustible c, Long cuentaId) {
        var autor = c.getAutorReferencia() == null ? c.autorRegistro() : c.getAutorReferencia();
        return new CombustibleResponse(c.getCodigo(), c.getVehiculo() == null ? null : c.getVehiculo().getCodigo(),
                c.getItinerario() == null ? null : c.getItinerario().getCodigo(), c.getFecha(),
                c.getTipo().toLowerCase(Locale.ROOT), c.getCantidad(), c.getSustento(), autor,
                java.util.Objects.equals(c.autorRegistroId(), cuentaId), c.anulacion());
    }
}
