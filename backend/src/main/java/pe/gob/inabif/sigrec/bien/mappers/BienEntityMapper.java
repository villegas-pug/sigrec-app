package pe.gob.inabif.sigrec.bien.mappers;

import pe.gob.inabif.sigrec.bien.dtos.BienDatos;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface BienEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(target = "nombre", source = "nombre")
    @Mapping(target = "codigoPatrimonial", source = "codigoPatrimonial")
    @Mapping(target = "descripcion", source = "descripcion")
    @Mapping(target = "marcaModelo", source = "marcaModelo")
    @Mapping(target = "serie", source = "serie")
    @Mapping(target = "deterioro", source = "deterioro")
    @Mapping(target = "cantidad", source = "cantidad")
    @Mapping(target = "vidaUtilAnios", source = "vidaUtilAnios")
    @Mapping(target = "costo", source = "adquisicion.costo")
    void fromModelToEntity(BienDatos source, @MappingTarget Bien entity);
}
