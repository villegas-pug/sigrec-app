package pe.gob.inabif.sigrec.intervencion.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.intervencion.dtos.IntervencionDatos;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;

@Mapper(config = BaseMapStructConfig.class)
public interface IntervencionEntityMapper {
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "descripcion", source = "descripcion")
    void fromModelToEntity(IntervencionDatos datos, @MappingTarget Intervencion registro);
}
