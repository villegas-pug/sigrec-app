package pe.gob.inabif.sigrec.precio.service;

import java.util.List;
import pe.gob.inabif.sigrec.precio.dtos.PrecioResponse;
import pe.gob.inabif.sigrec.precio.dtos.UpdatePrecioRequest;

public interface PrecioService {
    List<PrecioResponse> listar();
    PrecioResponse informar(String tipo, UpdatePrecioRequest request);
}
