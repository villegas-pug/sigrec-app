package pe.gob.inabif.sigrec.precio.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.precio.model.Precio;
import pe.gob.inabif.sigrec.precio.model.PrecioValor;

@Mapper(config = BaseMapStructConfig.class)
public interface PrecioEntityMapper {
    Precio toEntity(PrecioValor valor);
}
