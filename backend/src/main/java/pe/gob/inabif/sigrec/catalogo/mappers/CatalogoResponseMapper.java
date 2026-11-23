package pe.gob.inabif.sigrec.catalogo.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.catalogo.model.CatalogoDatos;
import pe.gob.inabif.sigrec.catalogo.dtos.CatalogoResponse;

@Mapper(config = BaseMapStructConfig.class)
public interface CatalogoResponseMapper {
    CatalogoResponse toResponse(CatalogoDatos source);
}
