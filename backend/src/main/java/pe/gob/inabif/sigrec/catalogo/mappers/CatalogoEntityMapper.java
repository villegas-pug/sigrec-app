package pe.gob.inabif.sigrec.catalogo.mappers;

import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.model.CatalogoDatos;

@Mapper(config = BaseMapStructConfig.class)
public interface CatalogoEntityMapper {
    @Mapping(target = "codigo", expression = "java(source.codigo())")
    @Mapping(target = "categoria", expression = "java(source.getCategoria() == null ? null : source.getCategoria().codigo())")
    CatalogoDatos toModel(Catalogo source);
}
