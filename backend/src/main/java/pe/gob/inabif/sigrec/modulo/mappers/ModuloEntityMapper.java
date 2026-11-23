package pe.gob.inabif.sigrec.modulo.mappers;

import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ModuloEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(source = "nombre", target = "nombre")
    @Mapping(source = "pisos", target = "pisos")
    @Mapping(source = "areaM2", target = "areaM2")
    @Mapping(source = "ubicacion", target = "ubicacion")
    void fromModelToEntity(ModuloDatos source, @MappingTarget Modulo target);
}
