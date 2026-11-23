package pe.gob.inabif.sigrec.incidencia.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.incidencia.dtos.*;
import pe.gob.inabif.sigrec.incidencia.mappers.*;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@RequiredArgsConstructor
@Transactional
public class IncidenciaServiceImpl implements IncidenciaService {
    private static final Set<String> TIPOS_BIEN = Set.of("dano", "robo", "incendio");
    private static final Set<String> TIPOS_NOVEDAD = Set.of("dano", "incendio", "humedad", "instalaciones", "estructura", "otro");
    private final IncidenteRepository incidentes;
    private final AtencionRepository atenciones;
    private final BienImplicadoRepository implicados;
    private final CentroRepository centros;
    private final CatalogoService catalogos;
    private final ReglasBien bienes;
    private final Acceso acceso;
    private final IncidenciaCreateMapper createMapper;
    private final IncidenciaUpdateMapper updateMapper;
    private final IncidenciaEntityMapper entityMapper;
    private final IncidenciaResponseMapper responseMapper;

    @Override
    public IncidenciaResponse crear(CreateIncidenciaRequest request) {
        var datos = createMapper.toModel(request);
        var hecho = new Incidente();
        hecho.setClase(request.novedad() ? "NOVEDAD" : "INCIDENCIA");
        var tipoOrigen = datos.origen().tipo();
        var id = datos.origen().id();
        if (request.novedad() && !"ambiente".equals(tipoOrigen)) throw invalido("Una novedad se registra en un ambiente.");
        hecho.setOrigen(codigo(tipoOrigen));
        prepararOrigen(hecho, tipoOrigen, id);
        bienes.bloquear(request.novedad() ? "novedad.registrar" : permisoOrigen(hecho), hecho.getCentro());
        if (!hecho.getCentro().vigente()) throw conflicto("El centro no está vigente.");
        if (hecho.getAmbiente() != null) bienes.exigirAmbienteVigente(hecho.getAmbiente());
        if (hecho.getBienOrigen() != null) bienes.exigirActivo(hecho.getBienOrigen());
        var actor = acceso.actor();
        actualizarDatos(hecho, datos);
        hecho.asignarCodigo(request.novedad() ? "NOV-" : "EV-");
        hecho.registrar(actor);
        incidentes.save(hecho);
        reemplazarAfectados(hecho, datos, actor, true);
        return responseMapper.resumen(hecho);
    }

    private void prepararOrigen(Incidente hecho, String tipo, String id) {
        if ("centro".equals(tipo)) {
            var centro = centros.findByCodigo(id).orElseThrow(ReglasBien::noDisponible);
            hecho.setCentro(centro);
            hecho.setNombreOrigen(centro.nombre());
            return;
        }

        var bien = "ambiente".equals(tipo) ? null : bienes.buscar(id);
        var ambiente = bien == null ? bienes.ambiente(id) : bien.getAmbiente();
        var centro = bienes.centro(ambiente);
        hecho.setCentro(centro);
        hecho.setAmbiente(ambiente);
        hecho.setModulo(ambiente.modulo());
        if (bien == null) {
            hecho.setNombreOrigen(ambiente.getNombre());
            hecho.setNombrePadre(centro.nombre() + " › " + ambiente.modulo().getNombre());
            return;
        }

        var principal = bien.getPrincipal();
        if ("componente".equals(tipo) != (principal != null)) throw invalido("El recurso no coincide con el origen indicado.");
        hecho.setBienOrigen(bien);
        hecho.setPrincipalOrigen(principal);
        hecho.setNombreOrigen(bien.getNombre());
        hecho.setNombrePadre(principal == null ? bienes.etiquetaAmbiente(ambiente) : principal.getNombre());
    }

    @Override
    public IncidenciaResponse editar(String codigo, UpdateIncidenciaRequest request) {
        var hecho = buscar(codigo);
        var esNovedad = esNovedad(hecho);
        bienes.bloquear(esNovedad ? "novedad.actualizar" : "incidente.actualizar", hecho.getCentro());
        if (!esNovedad) acceso.accionCentro(permisoOrigen(hecho), hecho.getCentro().codigo());
        incidentes.refresh(hecho);
        if (!hecho.vigente()) throw conflicto("El hecho está anulado.");
        var datos = updateMapper.toModel(request);
        if (!codigo(datos.origen().tipo()).equals(hecho.getOrigen()) || !idOrigen(hecho).equals(datos.origen().id())) {
            throw invalido("El origen del hecho no puede cambiar.");
        }
        actualizarDatos(hecho, datos);
        var actor = acceso.actor();
        hecho.actualizar(actor);
        reemplazarAfectados(hecho, datos, actor, false);
        return responseMapper.resumen(hecho);
    }

    private void actualizarDatos(Incidente hecho, IncidenciaDatos datos) {
        var infraestructura = Set.of("CENTRO", "AMBIENTE").contains(hecho.getOrigen());
        var tipo = datos.tipo();
        var permitido = esNovedad(hecho) ? TIPOS_NOVEDAD.contains(tipo)
                : TIPOS_BIEN.contains(tipo) || (infraestructura && TIPOS_NOVEDAD.contains(tipo));
        if (!permitido) throw invalido("Tipo de incidencia no válido para este origen.");
        entityMapper.fromModelToEntity(datos, hecho);
        hecho.setTitulo(datos.titulo().strip());
        hecho.setTipo(catalogos.obtener("TIPO_INCIDENCIA", tipo));
        if (datos.fecha() != null || hecho.getFecha() == null) hecho.setFecha(fecha(datos.fecha()));
        hecho.setUbicacion(esNovedad(hecho) ? datos.ubicacion() : null);
        hecho.setRequiereEvaluacion(infraestructura && datos.requiereEvaluacion() ? 1 : 0);
    }

    private void reemplazarAfectados(Incidente hecho, IncidenciaDatos datos, Usuario actor, boolean alta) {
        var ids = datos.bienIds() == null ? List.<String>of() : datos.bienIds();
        if (new HashSet<>(ids).size() != ids.size()) throw invalido("El bien afectado está duplicado.");
        if ((esNovedad(hecho) || "CENTRO".equals(hecho.getOrigen())) && !ids.isEmpty()) {
            throw invalido("Este origen no selecciona descendientes.");
        }
        if (hecho.getBienOrigen() != null && (ids.size() != 1 || !ids.getFirst().equals(hecho.getBienOrigen().getRotulo()))) {
            throw invalido("El recurso de origen no puede cambiar.");
        }
        var anteriores = implicados.findByIncidenteIdOrderById(hecho.id()).stream()
                .filter(BienImplicado::vigente)
                .collect(Collectors.toMap(a -> a.getBien().getRotulo(), Function.identity()));
        var evaluaciones = datos.evaluaciones() == null ? Map.<String,IncidenciaDatos.Evaluacion>of() : datos.evaluaciones();
        for (var id : ids) {
            var bien = bienes.buscar(id);
            if (!bienes.centro(bien).id().equals(hecho.getCentro().id())) throw noDisponible();
            var afectado = anteriores.remove(id);
            if (afectado == null && (!bienes.activo(bien) || !bien.getAmbiente().id().equals(hecho.getAmbiente().id()))) {
                throw invalido("Recurso no elegible.");
            }
            var evaluacion = evaluaciones.get(id);
            if (evaluacion == null || evaluacion.requiereReposicion() == null || evaluacion.unidades() == null) {
                throw invalido("Decida la reposición de cada recurso.");
            }
            if (evaluacion.unidades() < 1 || evaluacion.unidades() > bien.getCantidad()) {
                throw invalido("Cantidad afectada fuera del rango disponible.");
            }
            if (afectado == null) {
                afectado = new BienImplicado();
                afectado.setRol("AFECTADO");
                afectado.setIncidente(hecho);
                afectado.setBien(bien);
                afectado.registrar(actor);
            } else {
                afectado.actualizar(actor);
            }
            afectado.setCantidad(evaluacion.unidades());
            afectado.setRequiereReposicion(evaluacion.requiereReposicion() ? 1 : 0);
            afectado.setFuente("INDIVIDUAL");
            if (alta && datos.condiciones() != null && datos.condiciones().get(id) != null) {
                bienes.cambiarCondicion(bien, datos.condiciones().get(id), hecho.getTitulo(), hecho.getFecha(), hecho, actor);
                afectado.setCondicion(bien.getCondicion());
            }
            implicados.save(afectado);
        }
        anteriores.values().forEach(a -> a.anular(actor, "Se retiró el bien de la evaluación."));
    }

    @Override
    public void atender(String codigo, IncidenciaOperaciones.Atender request) {
        var hecho = buscar(codigo);
        bienes.bloquear("novedad.atender", hecho.getCentro());
        incidentes.refresh(hecho);
        if (!hecho.vigente() || (!esNovedad(hecho) && hecho.getRequiereEvaluacion() != 1)) {
            throw conflicto("El hecho no admite una atención.");
        }
        if (atenciones.findByIncidenteIdOrderById(hecho.id()).stream().anyMatch(Atencion::vigente)) {
            throw conflicto("El hecho ya cuenta con atención.");
        }
        var atencion = new Atencion();
        atencion.setIncidente(hecho);
        atencion.setFecha(fecha(request.fecha()));
        atencion.setDetalle(request.detalle());
        atencion.registrar(acceso.actor());
        atenciones.save(atencion);
    }

    @Override
    public void cambiarEstado(String codigo, String motivo) {
        var hecho = buscar(codigo);
        bienes.bloquear(esNovedad(hecho) ? "novedad.anular" : "incidente.anular", hecho.getCentro());
        incidentes.refresh(hecho);
        var actor = acceso.actor();
        if (motivo == null) {
            if (!hecho.vigente()) hecho.reactivar(actor);
        } else if (hecho.vigente()) {
            hecho.anular(actor, motivo.strip());
        }
    }

    private Incidente buscar(String codigo) { return incidentes.findByCodigo(codigo).orElseThrow(ReglasBien::noDisponible); }
    private boolean esNovedad(Incidente hecho) { return "NOVEDAD".equals(hecho.getClase()); }
    private String permisoOrigen(Incidente hecho) {
        return switch (hecho.getOrigen()) {
            case "CENTRO" -> "centro.incidente";
            case "AMBIENTE" -> "ambiente.incidente";
            default -> "bien.incidente";
        };
    }
    private String idOrigen(Incidente hecho) {
        if (hecho.getBienOrigen() != null) return hecho.getBienOrigen().getRotulo();
        return hecho.getAmbiente() == null ? hecho.getCentro().codigo() : hecho.getAmbiente().codigo();
    }
}
