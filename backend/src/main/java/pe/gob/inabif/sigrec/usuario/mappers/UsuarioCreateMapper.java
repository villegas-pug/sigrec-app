package pe.gob.inabif.sigrec.usuario.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.usuario.model.UsuarioDatos;
import pe.gob.inabif.sigrec.usuario.dtos.CreateUsuarioRequest;

@Mapper(config = BaseMapStructConfig.class)
public interface UsuarioCreateMapper {
    UsuarioDatos toModel(CreateUsuarioRequest source);
}
