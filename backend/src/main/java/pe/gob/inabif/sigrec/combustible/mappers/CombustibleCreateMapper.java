package pe.gob.inabif.sigrec.combustible.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.combustible.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface CombustibleCreateMapper {
    UpdateCombustibleRequest toModel(CreateCombustibleRequest datos);
}
