package pe.gob.inabif.sigrec.centro.mappers;

import pe.gob.inabif.sigrec.centro.dtos.CreateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface CentroCreateMapper {
    CentroDatos toModel(CreateCentroRequest request);
}
