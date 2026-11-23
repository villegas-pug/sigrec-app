package pe.gob.inabif.sigrec.precio.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.precio.dtos.UpdatePrecioRequest;
import pe.gob.inabif.sigrec.precio.model.PrecioValor;

@Mapper(config = BaseMapStructConfig.class)
public interface PrecioUpdateMapper {
    default PrecioValor toModel(UpdatePrecioRequest request) {
        var mes = request.fechaPrecio();
        var procedencia = request.procedencia();
        return new PrecioValor(request.precio(), mes == null ? null : mes.atDay(1),
                procedencia == null || procedencia.isEmpty() ? null : procedencia);
    }
}
