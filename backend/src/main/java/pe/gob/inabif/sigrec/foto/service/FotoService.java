package pe.gob.inabif.sigrec.foto.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import org.springframework.web.multipart.MultipartFile;
import pe.gob.inabif.sigrec.foto.dtos.*;

public interface FotoService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<FotoResponse> listar(FiltroConsulta filtro);

    default List<FotoResponse> listar() { return listar(FiltroConsulta.TODO); }

    FotoResponse crear(CreateFotoRequest request, MultipartFile archivo);
    FotoResponse editar(String codigo, UpdateFotoRequest request, MultipartFile archivo);
    FotoResponse cambiarEstado(String codigo, String motivo);
    FotoResponse.Contenido contenido(String codigo);
}
