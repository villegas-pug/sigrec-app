package pe.gob.inabif.sigrec.centro.mappers;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos.Fundacion;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos.Seguridad;
import pe.gob.inabif.sigrec.centro.dtos.InmuebleResponse;
import org.mapstruct.Mapper;
import java.util.Locale;
import java.time.YearMonth;

@Mapper(config = BaseMapStructConfig.class)
public interface CentroResponseMapper {
    default CentroResponse toResponse(Centro centro) {
        var construccion = new InmuebleResponse.Construccion(centro.getMaterial(), centro.getAntiguedad(), centro.getAntiguedadNota(), centro.getPisos(),
                centro.getAreaM2(), centro.getAreaTerrenoM2(), codigo(centro.getCondicion()), centro.getCaracteristicas());
        var inmueble = new InmuebleResponse(centro.getDireccion(), new Fundacion(centro.getFundacion(), centro.getFundacionNota()),
                centro.getCondicionInmueble().toLowerCase(Locale.ROOT), centro.getArrendador(), centro.getContratoHasta(), centro.getLitigios(),
                new Seguridad(centro.getExtintores()), construccion, centro.actualizacion());
        return new CentroResponse(centro.getCodigo(), centro.getNombre(), inmueble, centro.anulacion());
    }

    private String codigo(Catalogo catalogo) { return catalogo == null ? null : catalogo.codigo(); }
}
