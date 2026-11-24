package pe.gob.inabif.sigrec.itinerario.service;

import java.util.List;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.itinerario.dtos.*;

public interface ItinerarioService {
    /** SPEC 052: filtros de cabecera (centro y periodo de registro). */
    List<ItinerarioResponse> listar(FiltroConsulta filtro);

    default List<ItinerarioResponse> listar() { return listar(FiltroConsulta.TODO); }

    ItinerarioResponse crear(CreateItinerarioRequest request);
    ItinerarioResponse editar(String codigo, UpdateItinerarioRequest request);
    ItinerarioResponse ejecutar(String codigo, ItinerarioDatos.Tramo tramo);
    ItinerarioResponse cambiarEstado(String codigo, String motivo);
}
