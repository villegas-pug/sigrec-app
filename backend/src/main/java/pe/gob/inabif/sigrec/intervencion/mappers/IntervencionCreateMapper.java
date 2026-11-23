package pe.gob.inabif.sigrec.intervencion.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.intervencion.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface IntervencionCreateMapper {
    UpdateIntervencionRequest toModel(CreateIntervencionRequest request);
}
