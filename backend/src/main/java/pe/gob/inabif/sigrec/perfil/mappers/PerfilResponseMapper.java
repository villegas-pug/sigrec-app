package pe.gob.inabif.sigrec.perfil.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.perfil.model.Perfil;
import pe.gob.inabif.sigrec.perfil.dtos.PerfilResponse;

@Mapper(config = BaseMapStructConfig.class)
public interface PerfilResponseMapper {
    @Mapping(source = "alcance", target = "alcance")
    PerfilResponse toResponse(Perfil source, String alcance);
}
