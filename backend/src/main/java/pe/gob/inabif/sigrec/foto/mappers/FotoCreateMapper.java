package pe.gob.inabif.sigrec.foto.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.foto.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface FotoCreateMapper {
    UpdateFotoRequest toModel(CreateFotoRequest request);
}
