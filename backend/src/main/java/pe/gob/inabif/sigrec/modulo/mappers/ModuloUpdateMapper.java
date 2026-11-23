package pe.gob.inabif.sigrec.modulo.mappers;

import pe.gob.inabif.sigrec.modulo.dtos.UpdateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ModuloUpdateMapper {
    @Mapping(target = "carId", ignore = true)
    ModuloDatos toModel(UpdateModuloRequest request);
}
