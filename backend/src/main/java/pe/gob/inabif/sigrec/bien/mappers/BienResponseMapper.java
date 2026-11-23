package pe.gob.inabif.sigrec.bien.mappers;

import pe.gob.inabif.sigrec.bien.dtos.*;
import pe.gob.inabif.sigrec.bien.model.*;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import org.mapstruct.Mapper;

@Mapper(config = BaseMapStructConfig.class)
public interface BienResponseMapper {
    default BienResponse toResponse(Bien b) {
        var fecha = FechaAdquisicion.mostrar(b.getFechaAdquisicion(), b.getPrecisionAdquisicion());
        var adquisicion = new BienDatos.Adquisicion(fecha, b.getCosto());
        var asociado = b.getPrincipal() == null ? null : new BienDatos.Asociacion(b.getPrincipal().getRotulo(), b.getPosicion());
        return new BienResponse(b.getRotulo(), b.getAmbiente().codigo(), b.getTipo().codigo(), b.getNombre(),
                b.getCategoria().codigo(), b.getCodigoPatrimonial(), b.getMarcaModelo(), b.getSerie(), b.getDescripcion(),
                b.getCondicion() == null ? null : b.getCondicion().codigo(), b.getDeterioro(), adquisicion,
                b.getVidaUtilAnios(), b.getCantidad(), asociado, b.anulacion());
    }

    default InventarioPrevioResponse toResponse(InventarioPrevio p) {
        return new InventarioPrevioResponse(p.getCodigo(), p.getCentro().codigo(), p.getTipo().codigo(),
                p.getNombre(), p.getMarcaModelo(), p.getSerie(), p.getCodigoPatrimonial(), p.getUbicacionPrevia(),
                p.getCondicion() == null ? null : p.getCondicion().codigo(),
                FechaAdquisicion.mostrar(p.getFechaAdquisicion(), p.getPrecisionAdquisicion()),
                p.getBien() == null ? null : p.getBien().getRotulo());
    }
}
