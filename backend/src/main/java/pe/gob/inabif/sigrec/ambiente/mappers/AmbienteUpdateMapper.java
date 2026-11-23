package pe.gob.inabif.sigrec.ambiente.mappers;

import pe.gob.inabif.sigrec.ambiente.dtos.UpdateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface AmbienteUpdateMapper {
    AmbienteDatos toModel(UpdateAmbienteRequest request);
}
