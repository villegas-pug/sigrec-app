package pe.gob.inabif.sigrec.itinerario.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.itinerario.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ItinerarioCreateMapper {
    UpdateItinerarioRequest toModel(CreateItinerarioRequest request);
}
