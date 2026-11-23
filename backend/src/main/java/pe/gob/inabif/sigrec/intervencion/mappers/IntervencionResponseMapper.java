package pe.gob.inabif.sigrec.intervencion.mappers;

import java.time.YearMonth;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.intervencion.dtos.IntervencionResponse;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;

@Mapper(config = BaseMapStructConfig.class)
public interface IntervencionResponseMapper {
    default IntervencionResponse toResponse(Intervencion i) {
        var autor = i.getOrdenImportacion() == null ? i.autorRegistro() : i.getAutorReferencia();
        return new IntervencionResponse(i.getCodigo(), i.getAmbiente().codigo(), i.getDescripcion(),
                i.getFecha() == null ? null : YearMonth.from(i.getFecha()), i.getPintado() == 1, autor, i.anulacion());
    }

    default IntervencionResponse.Cambio cambio(Intervencion i) {
        var ultimo = i.getAmbiente().getUltimoPintado();
        return new IntervencionResponse.Cambio(toResponse(i), ultimo == null ? null : YearMonth.from(ultimo));
    }
}
