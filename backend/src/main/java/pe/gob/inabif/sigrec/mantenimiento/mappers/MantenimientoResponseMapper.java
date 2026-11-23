package pe.gob.inabif.sigrec.mantenimiento.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoResponse;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;

@Mapper(config = BaseMapStructConfig.class)
public interface MantenimientoResponseMapper {
    default MantenimientoResponse toResponse(Mantenimiento m) {
        return new MantenimientoResponse(m.getCodigo(), m.titular().codigo(),
                m.getBien() == null ? null : m.getBien().getRotulo(),
                m.getVehiculo() == null ? null : m.getVehiculo().getCodigo(),
                m.getTipo().codigo(), m.getFecha(), m.getProxima(), m.getDetalle(), m.getImporte(),
                m.getAutorReferencia() == null ? m.autorRegistro() : m.getAutorReferencia(), m.fechaRegistro().toLocalDate(), m.anulacion());
    }
}
