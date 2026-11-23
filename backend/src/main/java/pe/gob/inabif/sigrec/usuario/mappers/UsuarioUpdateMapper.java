package pe.gob.inabif.sigrec.usuario.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.usuario.model.UsuarioDatos;
import pe.gob.inabif.sigrec.usuario.dtos.UpdateUsuarioRequest;

@Mapper(config = BaseMapStructConfig.class)
public interface UsuarioUpdateMapper {
    @Mapping(target = "usuario", ignore = true)
    UsuarioDatos toModel(UpdateUsuarioRequest source);
}
