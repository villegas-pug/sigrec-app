package pe.gob.inabif.sigrec.itinerario.mappers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.List;
import org.mapstruct.Mapper;
import org.springframework.beans.factory.annotation.Autowired;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.itinerario.dtos.*;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioDatos.*;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;

@Mapper(config = BaseMapStructConfig.class)
public abstract class ItinerarioResponseMapper {
    @Autowired protected ObjectMapper json;

    public ItinerarioResponse toResponse(Itinerario i) {
        List<String> nombres;
        Ruta ruta = null;
        var km = i.getKm();
        if ("MAPA".equals(i.getModoRuta())) {
            var puntos = leer(i.getDestinos(), new TypeReference<List<Punto>>() {});
            var coordenadas = leer(i.getGeometria(), new TypeReference<List<List<Double>>>() {});
            nombres = puntos.stream().map(Punto::nombre).toList();
            ruta = new Ruta(i.getProveedorRuta(), i.getDistanciaRuta(), puntos, new Geometria("LineString", coordenadas));
            km = i.getDistanciaRuta().movePointLeft(3).setScale(2, RoundingMode.HALF_UP);
        } else nombres = leer(i.getDestinos(), new TypeReference<List<String>>() {});
        var previsto = i.getSalida() == null && i.getLlegada() == null && km == null ? null : tramo(i.getSalida(), i.getLlegada(), km);
        var realizado = i.getEjecutado() == 0 ? null : tramo(i.getSalidaReal(), i.getLlegadaReal(), i.getKmReal());
        return new ItinerarioResponse(i.getCodigo(), i.getVehiculo().getCodigo(), i.getFecha(), i.getProposito(), nombres,
                previsto, realizado, ruta, i.anulacion());
    }

    private Tramo tramo(Integer salida, Integer llegada, BigDecimal km) {
        return new Tramo(hora(salida), hora(llegada), km);
    }

    private String hora(Integer minutos) {
        return minutos == null ? null : LocalTime.ofSecondOfDay(minutos * 60L).toString();
    }

    private <T> T leer(String valor, TypeReference<T> tipo) {
        try {
            return json.readValue(valor, tipo);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Ruta almacenada inválida.", error);
        }
    }
}
