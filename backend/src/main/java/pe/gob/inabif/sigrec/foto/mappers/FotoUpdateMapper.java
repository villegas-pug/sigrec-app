package pe.gob.inabif.sigrec.foto.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.foto.dtos.*;

@Mapper(config = BaseMapStructConfig.class)
public interface FotoUpdateMapper {
    default FotoDatos toModel(UpdateFotoRequest request) {
        var datos = request.datos();
        return new FotoDatos(datos.titulo().strip(), datos.nota(), datos.ambienteId());
    }
}
