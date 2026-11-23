package pe.gob.inabif.sigrec.itinerario.service;

import java.util.List;
import pe.gob.inabif.sigrec.itinerario.dtos.*;

public interface ItinerarioService {
    List<ItinerarioResponse> listar();
    ItinerarioResponse crear(CreateItinerarioRequest request);
    ItinerarioResponse editar(String codigo, UpdateItinerarioRequest request);
    ItinerarioResponse ejecutar(String codigo, ItinerarioDatos.Tramo tramo);
    ItinerarioResponse cambiarEstado(String codigo, String motivo);
}
