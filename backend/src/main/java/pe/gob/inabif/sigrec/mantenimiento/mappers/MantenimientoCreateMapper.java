package pe.gob.inabif.sigrec.mantenimiento.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface MantenimientoCreateMapper {
    UpdateMantenimientoRequest toModel(CreateMantenimientoRequest request);
}
