package pe.gob.inabif.sigrec.elemento.mappers;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ElementoEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "nombre", expression = "java(source.label().strip())")
    @Mapping(target = "icono", source = "icono")
    void fromModelToEntity(Adicional source, @MappingTarget Elemento elemento);
}
