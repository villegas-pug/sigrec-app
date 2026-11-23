package pe.gob.inabif.sigrec.combustible.mappers;

import java.util.Locale;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;

@Mapper(config = BaseMapStructConfig.class)
public interface CombustibleUpdateMapper {
    default String tipo(String valor) { return valor.toUpperCase(Locale.ROOT); }
}
