package pe.gob.inabif.sigrec.modulo.mappers;

import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import org.mapstruct.Mapper;
import java.util.Locale;
import java.time.YearMonth;

@Mapper(config = BaseMapStructConfig.class)
public interface ModuloResponseMapper {
    default ModuloResponse toResponse(Modulo m) {
        return new ModuloResponse(m.codigo(), m.centro().codigo(), m.getNombre(), m.getTipo().toLowerCase(Locale.ROOT), m.getCapacidad(), m.getPisos(),
                m.getAreaM2(), codigo(m.getCondicion()), m.getUbicacion(), m.anulacion());
    }

    private String codigo(Catalogo catalogo) { return catalogo == null ? null : catalogo.codigo(); }
}
