package pe.gob.inabif.sigrec.foto.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.foto.dtos.FotoResponse;
import pe.gob.inabif.sigrec.foto.model.Foto;

@Mapper(config = BaseMapStructConfig.class)
public interface FotoResponseMapper {
    default FotoResponse toResponse(Foto f) {
        var url = f.getContenido() == null ? null : "/api/v1/fotos/" + f.getCodigo() + "/contenido?v=" + f.fechaCambio().hashCode();
        return new FotoResponse(f.getCodigo(), f.getCentro() == null ? null : f.getCentro().codigo(),
                f.getAmbiente() == null ? null : f.getAmbiente().codigo(),
                f.getBien() == null ? null : f.getBien().getRotulo(), f.getTitulo(), f.getFecha(), f.getNota(), url,
                f.getNombreArchivo(), f.getAutorReferencia() == null ? f.autorRegistro() : f.getAutorReferencia(), f.anulacion());
    }
}
