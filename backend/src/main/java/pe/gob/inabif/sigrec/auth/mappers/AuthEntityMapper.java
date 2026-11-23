package pe.gob.inabif.sigrec.auth.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.auth.model.Sesion;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import java.time.Instant;

@Mapper(config = BaseMapStructConfig.class)
public interface AuthEntityMapper {
    @BeanMapping(ignoreByDefault = true)
    @Mapping(source = "usuario", target = "usuario")
    @Mapping(source = "hash", target = "hash")
    @Mapping(source = "expira", target = "expira")
    Sesion toEntity(Usuario usuario, String hash, Instant expira);
}
