package pe.gob.inabif.sigrec.catalogo.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.catalogo.dtos.TipoBienRequest;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;

@Mapper(config = BaseMapStructConfig.class)
public interface TipoBienEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "nombre", expression = "java(datos.nombre().strip())")
    @Mapping(target = "vidaUtilSugerida", source = "vidaUtilSugerida")
    void fromRequest(TipoBienRequest datos, @MappingTarget Catalogo target);
}
