package pe.gob.inabif.sigrec.mantenimiento.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoDatos;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;

@Mapper(config = BaseMapStructConfig.class)
public interface MantenimientoEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "fecha", source = "fecha")
    @Mapping(target = "proxima", source = "proxima")
    @Mapping(target = "detalle", source = "detalle")
    @Mapping(target = "importe", source = "importe")
    void fromModelToEntity(MantenimientoDatos datos, @MappingTarget Mantenimiento registro);
}
