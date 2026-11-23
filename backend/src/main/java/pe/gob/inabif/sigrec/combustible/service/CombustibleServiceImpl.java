package pe.gob.inabif.sigrec.combustible.service;

import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.combustible.dtos.*;
import pe.gob.inabif.sigrec.combustible.mappers.*;
import pe.gob.inabif.sigrec.combustible.model.Combustible;
import pe.gob.inabif.sigrec.combustible.repository.CombustibleRepository;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;
import pe.gob.inabif.sigrec.itinerario.repository.ItinerarioRepository;
import pe.gob.inabif.sigrec.security.*;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@Transactional
@RequiredArgsConstructor
public class CombustibleServiceImpl implements CombustibleService {
    private static final String RUTA = "combustible";
    private final CombustibleRepository registros;
    private final ItinerarioRepository itinerarios;
    private final MovilidadAcceso movilidad;
    private final Acceso acceso;
    private final CombustibleCreateMapper createMapper;
    private final CombustibleUpdateMapper updateMapper;
    private final CombustibleEntityMapper entityMapper;
    private final CombustibleResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CombustibleResponse> listar() {
        var ids = movilidad.listar(RUTA).stream().map(Vehiculo::id).toList();
        if (ids.isEmpty()) return List.of();
        var actor = acceso.actor().id();
        return registros.listarAmbito(ids).stream().map(r -> responseMapper.toResponse(r, actor)).toList();
    }

    @Override
    public CombustibleResponse crear(CreateCombustibleRequest request) {
        var vehiculo = movilidad.bloquear(request.vehiculoId(), RUTA, "combustible.informar");
        movilidad.exigirVigente(vehiculo);
        var registro = new Combustible();
        registro.setCodigo("CB-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT));
        copiar(registro, vehiculo, createMapper.toModel(request).datos());
        var actor = acceso.actor();
        registro.registrar(actor);
        return responseMapper.toResponse(registros.save(registro), actor.id());
    }

    @Override
    public CombustibleResponse editar(String codigo, UpdateCombustibleRequest request) {
        var vehiculoCodigo = vehiculoDe(codigo);
        var vehiculo = movilidad.bloquear(vehiculoCodigo, RUTA, "combustible.actualizar", "combustible.actualizarPropio");
        movilidad.exigirVigente(vehiculo);
        var registro = buscar(codigo);
        if (!registro.vigente()) throw conflicto("El registro de combustible está anulado.");
        var actor = acceso.actor();
        if (!movilidad.permite(movilidad.porRuta(RUTA), vehiculo, "combustible.actualizar")
                && !Objects.equals(registro.autorRegistroId(), actor.id())) {
            throw new AccessDeniedException("Solo puede corregir sus propios registros.");
        }
        copiar(registro, vehiculo, request.datos());
        registro.actualizar(actor);
        return responseMapper.toResponse(registro, actor.id());
    }

    @Override
    public CombustibleResponse cambiarEstado(String codigo, String motivo) {
        var vehiculo = movilidad.bloquear(vehiculoDe(codigo), RUTA, "combustible.anular");
        var registro = buscar(codigo);
        var actor = acceso.actor();
        if (motivo == null && !registro.vigente()) {
            movilidad.exigirVigente(vehiculo);
            if (registro.getItinerario() != null) validarConsumo(registro.getItinerario(), vehiculo, registro.id());
            registro.reactivar(actor);
        } else if (motivo != null && registro.vigente()) registro.anular(actor, motivo.strip());
        return responseMapper.toResponse(registro, actor.id());
    }

    private String vehiculoDe(String codigo) {
        return registros.vehiculoDe(codigo).orElseThrow(() -> noDisponible());
    }

    private Combustible buscar(String codigo) {
        return registros.findByCodigo(codigo).orElseThrow(() -> noDisponible());
    }

    private void copiar(Combustible registro, Vehiculo vehiculo, CombustibleDatos d) {
        fecha(d.fecha());
        var tipo = updateMapper.tipo(d.tipo());
        Itinerario itinerario = null;
        if ("CONSUMO".equals(tipo)) {
            if (d.itinerarioId() == null) throw invalido("Seleccione un recorrido realizado.");
            itinerario = itinerarios.findByCodigo(d.itinerarioId()).orElseThrow(() -> noDisponible());
            validarConsumo(itinerario, vehiculo, registro.id());
        } else if (d.itinerarioId() != null) throw invalido("Una carga corresponde a un vehículo.");
        entityMapper.fromModelToEntity(d, registro);
        registro.setTipo(tipo);
        registro.setItinerario(itinerario);
        registro.setVehiculo(itinerario == null ? vehiculo : null);
    }

    private void validarConsumo(Itinerario itinerario, Vehiculo vehiculo, Long actual) {
        if (!itinerario.getVehiculo().id().equals(vehiculo.id())) throw noDisponible();
        if (!itinerario.vigente() || itinerario.getEjecutado() != 1) throw conflicto("Seleccione un recorrido vigente y realizado.");
        if (registros.findByItinerarioIdAndEstadoAndEliminado(itinerario.id(), 1, 0)
                .filter(r -> !Objects.equals(r.id(), actual)).isPresent()) throw conflicto("El recorrido ya tiene otro consumo declarado.");
    }

    public void importar(String codigo, Vehiculo vehiculo, CombustibleDatos datos, Usuario actor, String autor) {
        if (registros.findByCodigo(codigo).isPresent()) return;
        var registro = new Combustible();
        registro.setCodigo(codigo);
        copiar(registro, vehiculo, datos);
        registro.setAutorReferencia(autor);
        registro.registrar(actor);
        registros.save(registro);
    }
}
