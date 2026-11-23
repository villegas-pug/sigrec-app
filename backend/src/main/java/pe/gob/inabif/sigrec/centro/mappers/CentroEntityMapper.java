package pe.gob.inabif.sigrec.centro.mappers;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.*;

@Mapper(config = BaseMapStructConfig.class)
public interface CentroEntityMapper {
    @BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.SET_TO_NULL)
    @Mapping(source = "nombre", target = "nombre")
    @Mapping(source = "inmueble.direccion", target = "direccion")
    @Mapping(source = "inmueble.litigios", target = "litigios")
    @Mapping(source = "inmueble.fundacion.referencia", target = "fundacion")
    @Mapping(source = "inmueble.fundacion.nota", target = "fundacionNota")
    @Mapping(source = "inmueble.seguridad.extintoresRequeridos", target = "extintores")
    @Mapping(source = "inmueble.construccion.material", target = "material")
    @Mapping(source = "inmueble.construccion.antiguedad", target = "antiguedad")
    @Mapping(source = "inmueble.construccion.pisos", target = "pisos")
    @Mapping(source = "inmueble.construccion.areaM2", target = "areaM2")
    @Mapping(source = "inmueble.construccion.areaTerrenoM2", target = "areaTerrenoM2")
    @Mapping(source = "inmueble.construccion.caracteristicas", target = "caracteristicas")
    void fromModelToEntity(CentroDatos source, @MappingTarget Centro target);
}
