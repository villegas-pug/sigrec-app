package pe.gob.inabif.sigrec.servicio.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.servicio.dtos.CreateServicioRequest;
import pe.gob.inabif.sigrec.servicio.dtos.UpdateServicioRequest;

@Mapper(config = BaseMapStructConfig.class)
public interface ServicioCreateMapper {
    UpdateServicioRequest toModel(CreateServicioRequest request);
}
