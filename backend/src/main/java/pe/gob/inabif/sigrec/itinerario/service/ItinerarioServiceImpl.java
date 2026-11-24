package pe.gob.inabif.sigrec.itinerario.service;

import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.RoundingMode;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.combustible.repository.CombustibleRepository;
import pe.gob.inabif.sigrec.itinerario.dtos.*;
import pe.gob.inabif.sigrec.itinerario.mappers.*;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;
import pe.gob.inabif.sigrec.itinerario.repository.ItinerarioRepository;
import pe.gob.inabif.sigrec.security.*;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@Transactional
@RequiredArgsConstructor
public class ItinerarioServiceImpl implements ItinerarioService {
    private static final String RUTA = "itinerarios";
    private final ItinerarioRepository itinerarios;
    private final CombustibleRepository combustible;
    private final MovilidadAcceso movilidad;
    private final Acceso acceso;
    private final ItinerarioCreateMapper createMapper;
    private final ItinerarioUpdateMapper updateMapper;
    private final ItinerarioEntityMapper entityMapper;
    private final ItinerarioResponseMapper responseMapper;
    private final ObjectMapper json;

    @Override
    @Transactional(readOnly = true)
    public List<ItinerarioResponse> listar(FiltroConsulta filtro) {
        var ids = movilidad.listar(RUTA).stream().filter(v -> filtro.deCentro(v.getCentro().codigo()))
                .map(Vehiculo::id).toList();
        if (ids.isEmpty()) return List.of();
        return itinerarios.findByVehiculoIdInOrderById(ids).stream().filter(it -> filtro.incluye(it.fechaRegistro()))
                .map(responseMapper::toResponse).toList();
    }

    @Override
    public ItinerarioResponse crear(CreateItinerarioRequest request) {
        var vehiculo = movilidad.bloquear(request.vehiculoId(), RUTA, "itinerario.registrar");
        movilidad.exigirVigente(vehiculo);
        var itinerario = new Itinerario();
        itinerario.setCodigo("IT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT));
        itinerario.setVehiculo(vehiculo);
        copiar(itinerario, createMapper.toModel(request).datos());
        itinerario.registrar(acceso.actor());
        return responseMapper.toResponse(itinerarios.save(itinerario));
    }

    @Override
    public ItinerarioResponse editar(String codigo, UpdateItinerarioRequest request) {
        var it = bloquear(codigo, "itinerario.actualizar");
        exigirVigente(it);
        if (request.datos().realizado() == null && consumo(it)) {
            throw conflicto("El recorrido tiene un consumo declarado.");
        }
        copiar(it, request.datos());
        it.actualizar(acceso.actor());
        return responseMapper.toResponse(it);
    }

    @Override
    public ItinerarioResponse ejecutar(String codigo, ItinerarioDatos.Tramo tramo) {
        var it = bloquear(codigo, "itinerario.ejecucion");
        exigirVigente(it);
        fecha(it.getFecha());
        if ("MAPA".equals(it.getModoRuta()) && tramo.km() == null) {
            throw invalido("Confirme o corrija la distancia realizada.");
        }
        aplicarRealizado(it, tramo);
        it.actualizar(acceso.actor());
        return responseMapper.toResponse(it);
    }

    @Override
    public ItinerarioResponse cambiarEstado(String codigo, String motivo) {
        var it = bloquear(codigo, "itinerario.anular");
        if (motivo == null && !it.vigente()) {
            movilidad.exigirVigente(it.getVehiculo());
            it.reactivar(acceso.actor());
        } else if (motivo != null && it.vigente()) {
            if (consumo(it)) throw conflicto("El recorrido tiene un consumo declarado.");
            it.anular(acceso.actor(), motivo.strip());
        }
        return responseMapper.toResponse(it);
    }

    private boolean consumo(Itinerario it) {
        return combustible.findByItinerarioIdAndEstadoAndEliminado(it.id(), 1, 0).isPresent();
    }

    private void copiar(Itinerario it, ItinerarioDatos d) {
        if (d.fecha().getYear() < 1) throw invalido("Indique una fecha de itinerario válida.");
        if (d.realizado() != null) fecha(d.fecha());
        entityMapper.fromModelToEntity(d, it);
        var previsto = d.previsto();
        updateMapper.validar(previsto);
        it.setSalida(previsto == null ? null : updateMapper.minutos(previsto.salida()));
        it.setLlegada(previsto == null ? null : updateMapper.minutos(previsto.llegada()));
        aplicarRuta(it, d);
        aplicarRealizado(it, d.realizado());
    }

    private void aplicarRuta(Itinerario it, ItinerarioDatos d) {
        var ruta = d.ruta();
        it.setModoRuta(ruta == null ? "MANUAL" : "MAPA");
        if (ruta == null) {
            it.setKm(d.previsto() == null ? null : d.previsto().km());
            it.setDestinos(escribir(d.destinos().stream().map(String::strip).toList()));
            it.setProveedorRuta(null);
            it.setDistanciaRuta(null);
            it.setGeometria(null);
            return;
        }
        var distancia = ruta.distanciaM().setScale(3, RoundingMode.HALF_UP);
        if (distancia.precision() > 14 || ruta.puntos().stream().anyMatch(p -> !coordenada(p.lng(), p.lat()))
                || ruta.geometry().coordinates().stream().anyMatch(p -> !coordenada(p.get(0), p.get(1)))) {
            throw invalido("La geometría o la distancia de la ruta no es válida.");
        }
        it.setKm(null);
        it.setDestinos(escribir(ruta.puntos()));
        it.setProveedorRuta(ruta.proveedor());
        it.setDistanciaRuta(distancia);
        it.setGeometria(escribir(ruta.geometry().coordinates()));
    }

    private boolean coordenada(double lon, double lat) {
        return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
    }

    private String escribir(Object valor) {
        try {
            return json.writeValueAsString(valor);
        } catch (JsonProcessingException error) {
            throw invalido("No se pudo representar la ruta.");
        }
    }

    private void aplicarRealizado(Itinerario it, ItinerarioDatos.Tramo tramo) {
        updateMapper.validar(tramo);
        it.setEjecutado(tramo == null ? 0 : 1);
        it.setSalidaReal(tramo == null ? null : updateMapper.minutos(tramo.salida()));
        it.setLlegadaReal(tramo == null ? null : updateMapper.minutos(tramo.llegada()));
        it.setKmReal(tramo == null ? null : tramo.km());
    }

    private Itinerario bloquear(String codigo, String accion) {
        var vehiculo = itinerarios.vehiculoDe(codigo).orElseThrow(() -> noDisponible());
        movilidad.bloquear(vehiculo, RUTA, accion);
        return itinerarios.findByCodigo(codigo).orElseThrow(() -> noDisponible());
    }

    private void exigirVigente(Itinerario it) {
        movilidad.exigirVigente(it.getVehiculo());
        if (!it.vigente()) throw conflicto("El itinerario está anulado.");
    }
}
