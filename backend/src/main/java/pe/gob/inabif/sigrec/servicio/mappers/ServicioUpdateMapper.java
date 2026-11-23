package pe.gob.inabif.sigrec.servicio.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.servicio.dtos.HechoServicioRequest;
import pe.gob.inabif.sigrec.servicio.model.HechoServicio;

@Mapper(config = BaseMapStructConfig.class)
public interface ServicioUpdateMapper {
    HechoServicio toModel(HechoServicioRequest request);
}
