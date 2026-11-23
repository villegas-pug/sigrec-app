package pe.gob.inabif.sigrec.servicio.mappers;

import org.mapstruct.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.servicio.dtos.ServicioDatos;
import pe.gob.inabif.sigrec.servicio.model.Servicio;

@Mapper(config = BaseMapStructConfig.class)
public interface ServicioEntityMapper {
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL, ignoreByDefault = true)
    @Mapping(target = "proveedor", source = "proveedor")
    @Mapping(target = "suministro", source = "suministro")
    @Mapping(target = "contratacion", source = "contratacion")
    @Mapping(target = "observaciones", source = "observaciones")
    @Mapping(target = "contacto", source = "contacto.nombre")
    @Mapping(target = "telefono", source = "contacto.telefono")
    @Mapping(target = "renovacion", source = "renovacion.fecha")
    @Mapping(target = "detalleRenovacion", source = "renovacion.detalle")
    void fromModelToEntity(ServicioDatos datos, @MappingTarget Servicio destino);
}
