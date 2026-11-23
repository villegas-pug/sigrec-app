package pe.gob.inabif.sigrec.vehiculo.mappers;

import java.util.Map;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;

@Mapper(config = BaseMapStructConfig.class)
public interface VehiculoUpdateMapper {
    Map<String, String> ESTADOS = Map.of("operativo", "OPERATIVO", "requiereMantenimiento", "REQUIERE_MANTENIMIENTO",
            "detenido", "DETENIDO");

    default String estado(String valor) {
        return valor == null ? null : ESTADOS.get(valor);
    }
}
