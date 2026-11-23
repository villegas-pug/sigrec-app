package pe.gob.inabif.sigrec.inicio.dtos;

import java.util.List;
import pe.gob.inabif.sigrec.bien.dtos.InventarioResponse;
import pe.gob.inabif.sigrec.catalogo.dtos.TipoBienResponse;
import pe.gob.inabif.sigrec.centro.dtos.JerarquiaResponse;
import pe.gob.inabif.sigrec.combustible.dtos.CombustibleResponse;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioResponse;
import pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoResponse;
import pe.gob.inabif.sigrec.precio.dtos.PrecioResponse;
import pe.gob.inabif.sigrec.servicio.dtos.ServicioResponse;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoResponse;

/**
 * SPEC 041. Todo lo que necesita la pantalla de Inicio en una sola respuesta. Cada parte tiene exactamente la forma de su
 * endpoint individual, de modo que la SPA reutiliza sus cargadores y las demás pantallas no vuelven a pedirla.
 */
public record InicioDatosResponse(
        JerarquiaResponse jerarquia,
        InventarioResponse inventario,
        List<TipoBienResponse> tiposBien,
        List<PrecioResponse> precios,
        List<ServicioResponse> servicios,
        List<VehiculoResponse> vehiculos,
        List<ItinerarioResponse> itinerarios,
        List<CombustibleResponse> combustible,
        List<MantenimientoResponse> mantenimientos) {}
