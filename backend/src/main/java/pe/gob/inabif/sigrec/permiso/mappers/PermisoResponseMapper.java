package pe.gob.inabif.sigrec.permiso.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.permiso.model.Permiso;
import pe.gob.inabif.sigrec.permiso.dtos.PermisoResponse;

@Mapper(config = BaseMapStructConfig.class)
public interface PermisoResponseMapper {
    PermisoResponse toResponse(Permiso source);
}
