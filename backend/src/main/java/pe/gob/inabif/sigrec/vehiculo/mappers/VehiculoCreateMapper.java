package pe.gob.inabif.sigrec.vehiculo.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface VehiculoCreateMapper {
    UpdateVehiculoRequest toModel(CreateVehiculoRequest datos);
}
