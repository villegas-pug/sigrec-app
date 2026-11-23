package pe.gob.inabif.sigrec.servicio.mappers;

import java.time.YearMonth;
import java.util.*;
import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.servicio.dtos.*;
import pe.gob.inabif.sigrec.servicio.model.*;

@Mapper(config = BaseMapStructConfig.class)
public interface ServicioResponseMapper {
    default ServicioResponse toResponse(Servicio s, List<Periodo> filas, List<HechoServicio> hechos) {
        var contacto = s.getTelefono() == null && s.getContacto() == null ? null
                : new ServicioDatos.Contacto(s.getTelefono(), s.getContacto());
        var renovacion = s.getRenovacion() == null ? null
                : new ServicioDatos.Renovacion(s.getRenovacion(), s.getDetalleRenovacion());
        var inicio = s.getInicio() == null ? null
                : "ANIO".equals(s.getPrecisionInicio()) ? String.format("%04d", s.getInicio().getYear()) : YearMonth.from(s.getInicio()).toString();
        var periodos = new LinkedHashMap<Integer, ServicioResponse.Anio>();
        for (var p : filas) {
            if (!p.vigente() || p.getMeses() != s.getMeses() || "SIN_INFO".equals(p.getSituacion())) continue;
            var anio = periodos.computeIfAbsent(p.getAnio(), clave ->
                    new ServicioResponse.Anio(new ArrayList<>(), new ArrayList<>(), new LinkedHashMap<>()));
            if ("PAGADO".equals(p.getSituacion())) {
                anio.pagados().add(p.getNumero());
                anio.pagos().put(p.getNumero(), new UpdatePeriodoRequest.Pago(p.getPagoFecha(), p.getPagoImporte(), p.getPagoSustento()));
            } else {
                anio.pendientes().add(new ServicioResponse.Pendiente(p.getNumero(), p.getVence(), p.getMotivoPendiente(), p.getDetalle()));
            }
        }
        return new ServicioResponse(s.getCodigo(), s.getCentro().codigo(), s.getTipo().codigo(), Periodicidad.codigo(s.getMeses()),
                inicio, renovacion, s.getProveedor(), s.getSuministro(), s.getContratacion(), s.getObservaciones(), contacto,
                periodos, hechos.stream().map(this::hecho).toList(), s.anulacion());
    }

    private ServicioResponse.Hecho hecho(HechoServicio h) {
        var autor = h.getAutorReferencia() == null ? h.autorRegistro() : h.getAutorReferencia();
        return new ServicioResponse.Hecho(h.getCodigo(), h.getFecha(), h.getTipo().toLowerCase(Locale.ROOT),
                h.getDetalle(), autor, h.anulacion());
    }
}
