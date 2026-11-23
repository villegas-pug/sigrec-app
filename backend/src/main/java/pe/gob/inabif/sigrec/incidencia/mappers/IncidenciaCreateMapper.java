package pe.gob.inabif.sigrec.incidencia.mappers;
import pe.gob.inabif.sigrec.incidencia.dtos.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface IncidenciaCreateMapper {
    @Mapping(target = ".", source = "datos")
    IncidenciaDatos toModel(CreateIncidenciaRequest source);
}
