package pe.gob.inabif.sigrec.auth.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.auth.dtos.UpdateAuthRequest;

@Mapper(config = BaseMapStructConfig.class)
public interface AuthUpdateMapper {
    default String tokenId(UpdateAuthRequest source) { return source.jti(); }
}
