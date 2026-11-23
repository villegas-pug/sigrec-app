package pe.gob.inabif.sigrec.combustible.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.combustible.dtos.CombustibleDatos;
import pe.gob.inabif.sigrec.combustible.model.Combustible;

@Mapper(config = BaseMapStructConfig.class)
public interface CombustibleEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "fecha", source = "fecha")
    @Mapping(target = "cantidad", source = "cantidad")
    @Mapping(target = "sustento", source = "sustento")
    void fromModelToEntity(CombustibleDatos datos, @MappingTarget Combustible registro);
}
