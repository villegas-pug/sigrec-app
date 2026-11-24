package pe.gob.inabif.sigrec.elemento.mappers;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.Mapper;

@Mapper(config = BaseMapStructConfig.class)
public interface ElementoResponseMapper {
    default ElementoResponse toResponse(Elemento e) {
        var centro = e.getCentro();
        var modulo = e.getModulo();
        var ambiente = e.getAmbiente();
        var condicion = e.getCondicion();
        return new ElementoResponse(e.id(), centro == null ? null : centro.codigo(), modulo == null ? null : modulo.codigo(),
                ambiente == null ? null : ambiente.codigo(), e.getClave(), e.getNombre(), e.getIcono(), condicion == null ? null : condicion.codigo());
    }
}
