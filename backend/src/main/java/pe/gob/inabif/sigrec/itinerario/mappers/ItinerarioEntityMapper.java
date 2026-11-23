package pe.gob.inabif.sigrec.itinerario.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioDatos;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;

@Mapper(config = BaseMapStructConfig.class)
public interface ItinerarioEntityMapper {
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "fecha", source = "fecha")
    @Mapping(target = "proposito", source = "proposito")
    void fromModelToEntity(ItinerarioDatos datos, @MappingTarget Itinerario entidad);
}
