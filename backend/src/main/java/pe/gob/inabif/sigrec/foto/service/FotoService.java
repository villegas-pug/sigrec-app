package pe.gob.inabif.sigrec.foto.service;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import pe.gob.inabif.sigrec.foto.dtos.*;

public interface FotoService {
    List<FotoResponse> listar();
    FotoResponse crear(CreateFotoRequest request, MultipartFile archivo);
    FotoResponse editar(String codigo, UpdateFotoRequest request, MultipartFile archivo);
    FotoResponse cambiarEstado(String codigo, String motivo);
    FotoResponse.Contenido contenido(String codigo);
}
