package pe.gob.inabif.sigrec.modulo.mappers;

import pe.gob.inabif.sigrec.modulo.dtos.CreateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ModuloCreateMapper {
    ModuloDatos toModel(CreateModuloRequest request);
}
