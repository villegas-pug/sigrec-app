package pe.gob.inabif.sigrec.catalogo.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.catalogo.dtos.TipoBienResponse;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;

@Mapper(config = BaseMapStructConfig.class)
public interface TipoBienResponseMapper {
    default TipoBienResponse toResponse(Catalogo tipo) {
        return new TipoBienResponse(tipo.codigo(), tipo.nombre(), tipo.getCategoria().codigo(), tipo.getVidaUtilSugerida(), tipo.anulacion());
    }
}
