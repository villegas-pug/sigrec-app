package pe.gob.inabif.sigrec.usuario.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.usuario.model.UsuarioDatos;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

@Mapper(config = BaseMapStructConfig.class)
public interface UsuarioEntityMapper {
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "nombre", expression = "java(source.nombre().strip())")
    void fromModelToEntity(UsuarioDatos source, @MappingTarget Usuario target);
}
