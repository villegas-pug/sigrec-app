package pe.gob.inabif.sigrec.ambiente.mappers;

import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import org.mapstruct.Mapper;
import java.util.Locale;
import java.time.YearMonth;

@Mapper(config = BaseMapStructConfig.class)
public interface AmbienteResponseMapper {
    default AmbienteResponse toResponse(Ambiente a) {
        return new AmbienteResponse(a.codigo(), a.modulo().centro().codigo(), a.modulo().codigo(), a.getNombre(), a.getPiso(), a.getBloque(),
                a.getUbicacion(), a.getAreaM2(), a.getPuertas(), a.getVentanas(), codigo(a.getCondicion()),
                a.getUltimoPintado() == null ? null : YearMonth.from(a.getUltimoPintado()), a.anulacion());
    }

    private String codigo(Catalogo catalogo) { return catalogo == null ? null : catalogo.codigo(); }
}
