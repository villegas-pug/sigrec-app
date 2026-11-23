package pe.gob.inabif.sigrec.vehiculo.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

@Mapper(config = BaseMapStructConfig.class)
public interface VehiculoResponseMapper {
    default VehiculoResponse toResponse(Vehiculo v) {
        var estado = VehiculoUpdateMapper.ESTADOS.entrySet().stream().filter(e -> e.getValue().equals(v.getEstadoOperativo()))
                .map(java.util.Map.Entry::getKey).findFirst().orElse(null);
        var man = v.getMotivoMantenimiento() == null && v.getMontoMantenimiento() == null ? null
                : new VehiculoDatos.Mantenimiento(v.getMotivoMantenimiento(), v.getMontoMantenimiento());
        return new VehiculoResponse(v.getCodigo(), v.getCentro().codigo(), v.getTipo(), v.getPlaca(), v.getChofer(),
                v.getCombustible(), v.getRendimientoKmL(), estado, man, v.anulacion());
    }
}
