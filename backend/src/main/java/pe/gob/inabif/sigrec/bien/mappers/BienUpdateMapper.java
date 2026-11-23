package pe.gob.inabif.sigrec.bien.mappers;

import pe.gob.inabif.sigrec.bien.dtos.UpdateBienRequest;
import pe.gob.inabif.sigrec.bien.dtos.BienDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface BienUpdateMapper {
    @Mapping(target = ".", source = "bien")
    BienDatos toModel(UpdateBienRequest source);
}
