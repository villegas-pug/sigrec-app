package pe.gob.inabif.sigrec.auth.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.security.Acceso.Cuenta;
import pe.gob.inabif.sigrec.auth.dtos.AuthResponse;

@Mapper(config = BaseMapStructConfig.class)
public interface AuthResponseMapper {
    AuthResponse toResponse(Cuenta source);
}
