package pe.gob.inabif.sigrec.bien.mappers;

import pe.gob.inabif.sigrec.bien.dtos.CreateBienRequest;
import pe.gob.inabif.sigrec.bien.dtos.BienDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface BienCreateMapper {
    @Mapping(target = ".", source = "bien")
    BienDatos toModel(CreateBienRequest source);
}
