package pe.gob.inabif.sigrec.auth.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.auth.dtos.CreateAuthRequest;
import pe.gob.inabif.sigrec.auth.model.Credenciales;

@Mapper(config = BaseMapStructConfig.class)
public interface AuthCreateMapper {
    Credenciales toModel(CreateAuthRequest source);
}
