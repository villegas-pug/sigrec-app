package pe.gob.inabif.sigrec.vehiculo.service;

import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.security.*;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;
import pe.gob.inabif.sigrec.vehiculo.mappers.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@RequiredArgsConstructor
@Transactional
public class VehiculoServiceImpl implements VehiculoService {
    private final VehiculoRepository vehiculos;
    private final CentroService centros;
    private final MovilidadAcceso movilidad;
    private final Acceso acceso;
    private final VehiculoEntityMapper entityMapper;
    private final VehiculoCreateMapper createMapper;
    private final VehiculoUpdateMapper updateMapper;
    private final VehiculoResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<VehiculoResponse> listar() {
        return movilidad.listar("vehiculos", "centros").stream().map(responseMapper::toResponse).toList();
    }

    @Override
    public VehiculoResponse crear(CreateVehiculoRequest request) {
        acceso.accionCentro("vehiculos", "vehiculo.registrar", request.carId());
        var centro = centros.bloquear(request.carId());
        if (!centro.vigente()) throw conflicto("El centro está anulado.");
        var vehiculo = new Vehiculo();
        vehiculo.setCentro(centro);
        var prefijo = centro.codigo().substring(0, Math.min(33, centro.codigo().length())) + "-V";
        int numero = 1;
        var codigo = prefijo + String.format(Locale.ROOT, "%02d", numero);
        while (vehiculos.existsByCodigo(codigo)) codigo = prefijo + String.format(Locale.ROOT, "%02d", ++numero);
        vehiculo.setCodigo(codigo);
        copiar(vehiculo, createMapper.toModel(request).datos());
        validarPlaca(vehiculo);
        vehiculo.registrar(acceso.actor());
        return responseMapper.toResponse(vehiculos.save(vehiculo));
    }

    @Override
    public VehiculoResponse editar(String codigo, UpdateVehiculoRequest request) {
        var v = movilidad.bloquear(codigo, "vehiculos", "vehiculo.actualizar");
        movilidad.exigirVigente(v);
        copiar(v, request.datos());
        validarPlaca(v);
        v.actualizar(acceso.actor());
        return responseMapper.toResponse(v);
    }

    @Override
    public VehiculoResponse cambiarEstado(String codigo, String motivo) {
        var v = movilidad.bloquear(codigo, "vehiculos", "vehiculo.anular");
        if (motivo == null && !v.vigente()) {
            // El centro se comprueba también al dar de alta vehículos.
            if (!centros.bloquear(v.getCentro().codigo()).vigente()) throw conflicto("El centro está anulado.");
            validarPlaca(v);
            v.reactivar(acceso.actor());
        } else if (motivo != null && v.vigente()) v.anular(acceso.actor(), motivo.strip());
        return responseMapper.toResponse(v);
    }

    private void validarPlaca(Vehiculo v) {
        if (vehiculos.placaOcupada(v.getPlaca(), v.id())) throw conflicto("Ya existe un vehículo con esa placa.");
    }

    private void copiar(Vehiculo v, VehiculoDatos datos) {
        entityMapper.fromModelToEntity(datos, v);
        v.setPlaca(datos.placa().strip().toUpperCase(Locale.ROOT));
        var estado = updateMapper.estado(datos.estadoOperativo());
        v.setEstadoOperativo(estado);
        var requiere = "DETENIDO".equals(estado) || "REQUIERE_MANTENIMIENTO".equals(estado);
        var m = requiere ? datos.mantenimiento() : null;
        v.setMotivoMantenimiento(m == null ? null : m.motivo());
        v.setMontoMantenimiento(m == null ? null : m.presupuestoEstimado());
    }

    public void importar(String codigo, CreateVehiculoRequest datos, Usuario actor) {
        var centro = centros.bloquear(datos.carId());
        if (vehiculos.existsByCodigo(codigo)) return;
        var v = new Vehiculo();
        v.setCodigo(codigo);
        v.setCentro(centro);
        copiar(v, datos.datos());
        v.registrar(actor);
        vehiculos.save(v);
    }
}
