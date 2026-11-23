package pe.gob.inabif.sigrec.itinerario.mappers;

import java.time.LocalTime;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioDatos.Tramo;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.invalido;

@Mapper(config = BaseMapStructConfig.class)
public interface ItinerarioUpdateMapper {
    default Integer minutos(String valor) {
        return valor == null ? null : LocalTime.parse(valor).toSecondOfDay() / 60;
    }

    default void validar(Tramo datos) {
        if (datos != null && datos.salida() != null && datos.llegada() != null && datos.llegada().compareTo(datos.salida()) < 0) {
            throw invalido("La llegada no puede ser anterior a la salida.");
        }
    }
}
