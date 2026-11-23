package pe.gob.inabif.sigrec.centro.mappers;

import pe.gob.inabif.sigrec.centro.dtos.UpdateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface CentroUpdateMapper {
    @Mapping(target = "id", ignore = true)
    CentroDatos toModel(UpdateCentroRequest request);
}
