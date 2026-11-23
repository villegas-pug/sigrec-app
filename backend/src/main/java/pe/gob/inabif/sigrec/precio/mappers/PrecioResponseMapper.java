package pe.gob.inabif.sigrec.precio.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.precio.dtos.PrecioResponse;
import pe.gob.inabif.sigrec.precio.model.Precio;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Mapper(config = BaseMapStructConfig.class)
public interface PrecioResponseMapper {
    default PrecioResponse toResponse(String tipo, List<Precio> precios) {
        var actual = precios.stream().filter(Precio::esActual).findFirst().orElse(null);
        var historicos = precios.stream().filter(p -> p.getReemplazadoEl() != null).map(this::historico).toList();
        return new PrecioResponse(tipo, actual == null ? null : actual.getPrecio(),
                actual == null ? null : mes(actual.getFechaPrecio()),
                actual == null ? null : actual.getProcedencia(), historicos);
    }

    private PrecioResponse.Historico historico(Precio precio) {
        var autor = precio.getReemplazadoPor();
        return new PrecioResponse.Historico(precio.getPrecio(), mes(precio.getFechaPrecio()), precio.getProcedencia(),
                precio.getReemplazadoEl().toLocalDate(), autor == null ? null : autor.nombre());
    }

    private String mes(LocalDate fecha) {
        return fecha == null ? null : YearMonth.from(fecha).toString();
    }
}
