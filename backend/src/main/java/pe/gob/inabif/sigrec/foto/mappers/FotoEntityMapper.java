package pe.gob.inabif.sigrec.foto.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.foto.dtos.FotoDatos;
import pe.gob.inabif.sigrec.foto.model.Foto;

@Mapper(config = BaseMapStructConfig.class)
public interface FotoEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "nota", source = "nota")
    void fromModelToEntity(FotoDatos datos, @MappingTarget Foto foto);
}
