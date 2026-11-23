package pe.gob.inabif.sigrec.usuario.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.dtos.AsignacionUsuario;
import pe.gob.inabif.sigrec.usuario.dtos.UsuarioResponse;
import java.util.List;

@Mapper(config = BaseMapStructConfig.class)
public interface UsuarioResponseMapper {
    @Mapping(target = "activo", expression = "java(usuario.vigente())")
    UsuarioResponse toResponse(Usuario usuario, List<AsignacionUsuario> asignaciones);
}
