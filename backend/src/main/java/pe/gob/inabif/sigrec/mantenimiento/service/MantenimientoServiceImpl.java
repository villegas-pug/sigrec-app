package pe.gob.inabif.sigrec.mantenimiento.service;

import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;
import pe.gob.inabif.sigrec.mantenimiento.mappers.*;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;
import pe.gob.inabif.sigrec.mantenimiento.repository.MantenimientoRepository;
import pe.gob.inabif.sigrec.security.*;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.vehiculo.mappers.VehiculoResponseMapper;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@Transactional
@RequiredArgsConstructor
public class MantenimientoServiceImpl implements MantenimientoService {
    private final MantenimientoRepository mantenimientos;
    private final CentroService centros;
    private final CentroRepository centrosRepo;
    private final CatalogoService catalogos;
    private final ReglasBien bienes;
    private final VehiculoRepository vehiculos;
    private final MovilidadAcceso movilidad;
    private final Acceso acceso;
    private final MantenimientoEntityMapper entityMapper;
    private final MantenimientoCreateMapper createMapper;
    private final MantenimientoUpdateMapper updateMapper;
    private final MantenimientoResponseMapper responseMapper;
    private final VehiculoResponseMapper vehiculoMapper;

    @Override
    @Transactional(readOnly = true)
    public List<MantenimientoResponse> listar() {
        var grants = movilidad.porRuta("centros", "vehiculos");
        if (grants.stream().anyMatch(a -> a.global() && a.rutas().contains("centros"))) {
            return mantenimientos.findAllByOrderById().stream().map(responseMapper::toResponse).toList();
        }
        var codigos = grants.stream().filter(a -> a.rutas().contains("centros") && "CENTRO".equals(a.alcance()))
                .map(a -> a.centro().codigo()).distinct().toList();
        var ids = movilidad.listar("centros", "vehiculos").stream().map(Vehiculo::id).toList();
        if (codigos.isEmpty() && ids.isEmpty()) return List.of();
        return mantenimientos.listarAmbito(codigos, ids).stream().map(responseMapper::toResponse).toList();
    }

    @Override
    public MantenimientoResponse.Alta crear(CreateMantenimientoRequest request) {
        var tipo = catalogos.obtener("TIPO_MANTENIMIENTO", request.tipo());
        var objetivo = tipo.getObjetivo();
        var ids = request.objetivos();
        var esCentro = "CENTRO".equals(objetivo);
        var esVehiculo = "VEHICULO".equals(objetivo);
        if (esCentro != ids.isEmpty() || new HashSet<>(ids).size() != ids.size()
                || request.quedaOperativo() && (!esVehiculo || ids.size() != 1)) {
            throw invalido("Revise los objetivos del mantenimiento.");
        }
        if (!esVehiculo) {
            acceso.accionCentro("mantenimiento.registrar", request.carId());
            if (!centros.bloquear(request.carId()).vigente()) throw conflicto("El centro está anulado.");
        }
        var datos = updateMapper.toModel(createMapper.toModel(request));
        var actor = acceso.actor();
        var filas = new ArrayList<MantenimientoResponse>();
        Vehiculo operativo = null;
        if (esCentro) {
            var centro = centrosRepo.findByCodigo(request.carId()).orElseThrow(() -> noDisponible());
            filas.add(registrar(tipo, centro, null, null, datos, actor));
        } else if (esVehiculo) {
            var bloqueados = new HashMap<String, Vehiculo>();
            for (var codigo : ids.stream().sorted().toList()) {
                var v = movilidad.bloquear(codigo, "vehiculos", "mantenimiento.registrar");
                movilidad.exigirVigente(v);
                if (!request.carId().equals(v.getCentro().codigo())) throw noDisponible();
                bloqueados.put(codigo, v);
            }
            for (var codigo : ids) {
                var v = bloqueados.get(codigo);
                if (request.quedaOperativo()) {
                    if (!movilidad.permite(movilidad.porRuta("vehiculos"), v, "vehiculo.actualizar")) {
                        throw new org.springframework.security.access.AccessDeniedException("No puede actualizar el vehículo.");
                    }
                    v.setEstadoOperativo("OPERATIVO");
                    v.setMotivoMantenimiento(null);
                    v.setMontoMantenimiento(null);
                    v.actualizar(actor);
                    operativo = v;
                }
                filas.add(registrar(tipo, null, null, v, datos, actor));
            }
        } else {
            for (var codigo : ids) {
                var bien = bienes.buscar(codigo);
                if (!bienes.centro(bien).codigo().equals(request.carId())) throw noDisponible();
                bienes.exigirActivo(bien);
                bienes.exigirAmbienteVigente(bien.getAmbiente());
                var extintor = "extintor".equals(bien.getTipo().codigo());
                if ("recarga_extintor".equals(tipo.codigo()) ? !extintor : extintor || !"equipo".equals(bien.getCategoria().codigo())) {
                    throw invalido("El bien no corresponde al tipo de mantenimiento.");
                }
                filas.add(registrar(tipo, null, bien, null, datos, actor));
            }
        }
        return new MantenimientoResponse.Alta(filas, operativo == null ? null : vehiculoMapper.toResponse(operativo));
    }

    private MantenimientoResponse registrar(Catalogo tipo, Centro centro, Bien bien, Vehiculo vehiculo,
                                           MantenimientoDatos datos, Usuario actor) {
        var m = new Mantenimiento();
        m.asignarCodigo("MAN-");
        objetivos(m, tipo, centro, bien, vehiculo);
        copiar(m, datos);
        m.registrar(actor);
        return responseMapper.toResponse(mantenimientos.save(m));
    }

    private void objetivos(Mantenimiento m, Catalogo tipo, Centro centro, Bien bien, Vehiculo vehiculo) {
        m.setTipo(tipo);
        m.setCentro(centro);
        m.setBien(bien);
        m.setVehiculo(vehiculo);
    }

    @Override
    public MantenimientoResponse editar(String codigo, UpdateMantenimientoRequest request) {
        var m = bloquear(codigo, "mantenimiento.actualizar");
        if (!m.vigente()) throw conflicto("El mantenimiento está anulado.");
        copiar(m, updateMapper.toModel(request));
        m.actualizar(acceso.actor());
        return responseMapper.toResponse(m);
    }

    @Override
    public MantenimientoResponse cambiarEstado(String codigo, String motivo) {
        var m = bloquear(codigo, "mantenimiento.anular");
        if (motivo == null && !m.vigente()) m.reactivar(acceso.actor());
        else if (motivo != null && m.vigente()) m.anular(acceso.actor(), motivo.strip());
        return responseMapper.toResponse(m);
    }

    private Mantenimiento bloquear(String codigo, String permiso) {
        var m = mantenimientos.findByCodigo(codigo).orElseThrow(() -> noDisponible());
        if (m.getVehiculo() != null) movilidad.bloquear(m.getVehiculo().getCodigo(), "vehiculos", permiso);
        else {
            var centro = m.titular().codigo();
            acceso.accionCentro(permiso, centro);
            centros.bloquear(centro);
        }
        return m;
    }

    private void copiar(Mantenimiento m, MantenimientoDatos datos) {
        fecha(datos.fecha());
        if (datos.fecha().getYear() < 1 || datos.proxima() != null && datos.proxima().isBefore(datos.fecha())) {
            throw invalido("Revise la fecha del mantenimiento y la del próximo control.");
        }
        entityMapper.fromModelToEntity(datos, m);
    }

    public void importar(String codigo, String carId, String bienId, String vehiculoId, String tipoCodigo,
                         MantenimientoDatos datos, String autor, LocalDate fechaRegistro, Usuario actor) {
        if (mantenimientos.findByCodigo(codigo).isPresent()) return;
        var tipo = catalogos.obtener("TIPO_MANTENIMIENTO", tipoCodigo);
        var m = new Mantenimiento();
        m.setCodigo(codigo);
        var centro = bienId == null && vehiculoId == null ? centrosRepo.findByCodigo(carId).orElseThrow() : null;
        var bien = bienId == null ? null : bienes.buscar(bienId);
        var vehiculo = vehiculoId == null ? null : vehiculos.findByCodigo(vehiculoId).orElseThrow();
        objetivos(m, tipo, centro, bien, vehiculo);
        copiar(m, datos);
        m.setAutorReferencia(autor);
        m.registrar(actor, fechaRegistro == null ? null : fechaRegistro.atStartOfDay());
        mantenimientos.save(m);
    }
}
