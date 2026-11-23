package pe.gob.inabif.sigrec.incidencia.mappers;
import pe.gob.inabif.sigrec.incidencia.dtos.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface IncidenciaUpdateMapper {
    @Mapping(target = ".", source = "datos")
    IncidenciaDatos toModel(UpdateIncidenciaRequest source);
}
