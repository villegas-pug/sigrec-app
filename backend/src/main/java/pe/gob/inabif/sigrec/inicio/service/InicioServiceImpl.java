package pe.gob.inabif.sigrec.inicio.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.gob.inabif.sigrec.bien.service.InventarioConsulta;
import pe.gob.inabif.sigrec.catalogo.service.TipoBienService;
import pe.gob.inabif.sigrec.centro.service.JerarquiaQueries;
import pe.gob.inabif.sigrec.combustible.service.CombustibleService;
import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;
import pe.gob.inabif.sigrec.itinerario.service.ItinerarioService;
import pe.gob.inabif.sigrec.mantenimiento.service.MantenimientoService;
import pe.gob.inabif.sigrec.precio.service.PrecioService;
import pe.gob.inabif.sigrec.servicio.service.ServicioService;
import pe.gob.inabif.sigrec.vehiculo.service.VehiculoService;

/**
 * Compone las consultas que ya existen por colección. No duplica reglas ni consultas: cada servicio conserva su propio
 * control de acceso y su transacción de solo lectura.
 */
@Service
@RequiredArgsConstructor
public class InicioServiceImpl implements InicioService {
    private final JerarquiaQueries jerarquia;
    private final InventarioConsulta inventario;
    private final TipoBienService tiposBien;
    private final PrecioService precios;
    private final ServicioService servicios;
    private final VehiculoService vehiculos;
    private final ItinerarioService itinerarios;
    private final CombustibleService combustible;
    private final MantenimientoService mantenimientos;

    @Override
    public InicioDatosResponse consultar() {
        return new InicioDatosResponse(
                jerarquia.consultar(),
                inventario.consultar(),
                tiposBien.listar(),
                precios.listar(),
                servicios.listar(),
                vehiculos.listar(),
                itinerarios.listar(),
                combustible.listar(),
                mantenimientos.listar());
    }
}
