package pe.gob.inabif.sigrec.vehiculo.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoDatos;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

@Mapper(config = BaseMapStructConfig.class)
public interface VehiculoEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "tipo", source = "tipo")
    @Mapping(target = "placa", source = "placa")
    @Mapping(target = "chofer", source = "chofer")
    @Mapping(target = "combustible", source = "combustible")
    @Mapping(target = "rendimientoKmL", source = "rendimientoKmL")
    void fromModelToEntity(VehiculoDatos datos, @MappingTarget Vehiculo vehiculo);
}
