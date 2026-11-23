package pe.gob.inabif.sigrec.mantenimiento.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface MantenimientoUpdateMapper {
    default MantenimientoDatos toModel(UpdateMantenimientoRequest request) {
        var d = request.datos();
        return new MantenimientoDatos(d.fecha(), d.proxima(), d.detalle() == null ? null : d.detalle().strip(), d.importe());
    }
}
