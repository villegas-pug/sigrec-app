package pe.gob.inabif.sigrec.ambiente.mappers;

import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface AmbienteEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(source = "nombre", target = "nombre")
    @Mapping(source = "piso", target = "piso")
    @Mapping(source = "bloque", target = "bloque")
    @Mapping(source = "ubicacion", target = "ubicacion")
    @Mapping(source = "areaM2", target = "areaM2")
    @Mapping(source = "puertas", target = "puertas")
    @Mapping(source = "ventanas", target = "ventanas")
    void fromModelToEntity(AmbienteDatos source, @MappingTarget Ambiente target);
}
