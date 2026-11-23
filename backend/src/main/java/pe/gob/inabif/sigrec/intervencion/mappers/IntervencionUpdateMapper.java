package pe.gob.inabif.sigrec.intervencion.mappers;

import java.time.LocalDate;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.intervencion.dtos.UpdateIntervencionRequest;

@Mapper(config = BaseMapStructConfig.class)
public interface IntervencionUpdateMapper {
    default LocalDate mes(UpdateIntervencionRequest request) {
        return request.datos().fecha() == null ? null : request.datos().fecha().atDay(1);
    }
}
