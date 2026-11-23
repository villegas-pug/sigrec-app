package pe.gob.inabif.sigrec.incidencia.mappers;

import pe.gob.inabif.sigrec.incidencia.dtos.IncidenciaDatos;
import pe.gob.inabif.sigrec.incidencia.model.Incidente;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface IncidenciaEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "titulo", source = "titulo")
    @Mapping(target = "detalle", source = "detalle")
    void fromModelToEntity(IncidenciaDatos source, @MappingTarget Incidente target);
}
