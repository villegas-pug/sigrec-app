package pe.gob.inabif.sigrec.bien.service;

import lombok.RequiredArgsConstructor;
import pe.gob.inabif.sigrec.bien.dtos.InventarioResponse;
import pe.gob.inabif.sigrec.bien.mappers.BienResponseMapper;
import pe.gob.inabif.sigrec.bien.model.HistorialBien;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.incidencia.mappers.IncidenciaResponseMapper;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventarioConsultaImpl implements InventarioConsulta {
    private static final Set<String> RUTAS = Set.of("centros", "incidencias", "inventario", "necesidades", "inicio");
    private final BienRepository bienes;
    private final InventarioPrevioRepository previos;
    private final HistorialBienRepository historial;
    private final IncidenteRepository incidentes;
    private final AtencionRepository atenciones;
    private final BajaRepository bajas;
    private final ReposicionRepository reposiciones;
    private final BienImplicadoRepository implicados;
    private final CentroRepository centros;
    private final BienResponseMapper bienesMapper;
    private final IncidenciaResponseMapper hechosMapper;
    private final Acceso acceso;

    @Override
    public InventarioResponse consultar(FiltroConsulta filtro, Registro registro) {
        // SPEC 052: el periodo acota los hechos (Incidencias) o los bienes con su inventario previo (Necesidades,
        // Inventario); en ese caso los hechos siguen completos, porque son la historia de los bienes.
        if (filtro.porPeriodo() && registro == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique a qué registro se aplica el periodo.");
        }
        var periodoBienes = registro == Registro.BIEN ? filtro : FiltroConsulta.TODO;
        var periodoHechos = registro == Registro.HECHO ? filtro : FiltroConsulta.TODO;
        // CENTRO llega ya traducido en centros (FiltroCentros); aquí no se recibe.
        var grants = acceso.concesiones().stream().filter(a -> !"VEHICULO".equals(a.alcance())
                && a.rutas().stream().anyMatch(RUTAS::contains)).toList();
        if (grants.isEmpty()) throw new AccessDeniedException("Consulta de inventario no autorizada.");
        var ids = grants.stream().anyMatch(Acceso.Asignacion::global)
                ? centros.findAllByOrderById().stream().map(Centro::codigo).toList()
                : grants.stream().map(a -> a.centro().codigo()).distinct().toList();
        // Un centro fuera del ámbito deja la consulta vacía.
        ids = ids.stream().filter(filtro::deCentro).toList();
        if (ids.isEmpty()) return new InventarioResponse(List.of(), List.of(), List.of());
        var activos = bienes.findByAmbienteModuloCentroCodigoInOrderById(ids).stream()
                .filter(b -> periodoBienes.incluye(b.fechaRegistro())).map(bienesMapper::toResponse).toList();
        var anteriores = previos.findByCentroCodigoInOrderById(ids).stream()
                .filter(p -> periodoBienes.incluye(p.fechaRegistro())).map(bienesMapper::toResponse).toList();
        return new InventarioResponse(activos, anteriores, hechos(ids, periodoHechos));
    }

    private List<Map<String,Object>> hechos(List<String> ids, FiltroConsulta filtro) {
        var ordenados = new ArrayList<Vista>();
        var historia = historial.findByBienAmbienteModuloCentroCodigoInOrderById(ids);
        var hijos = historia.stream().filter(h -> h.getTrasladoPrincipal() != null && h.vigente())
                .collect(Collectors.groupingBy(h -> h.getTrasladoPrincipal().id()));
        historia.stream().filter(h -> h.getTrasladoPrincipal() == null)
                .forEach(h -> ordenados.add(new Vista(h, hechosMapper.toResponse(h, hijos.getOrDefault(h.id(), List.of())))));
        for (var i : incidentes.findByCentroCodigoInOrderById(ids)) {
            var afectados = vigentes(implicados.findByIncidenteIdOrderById(i.id()));
            var atencion = atenciones.findByIncidenteIdOrderById(i.id()).stream().filter(Atencion::vigente).findFirst().orElse(null);
            ordenados.add(new Vista(i, hechosMapper.toResponse(i, afectados, atencion)));
        }
        for (var b : bajas.findByBienAmbienteModuloCentroCodigoInOrderById(ids)) {
            ordenados.add(new Vista(b, hechosMapper.toResponse(b, vigentes(implicados.findByBajaIdOrderById(b.id())))));
        }
        for (var r : reposiciones.findByBajaBienAmbienteModuloCentroCodigoInOrderById(ids)) {
            ordenados.add(new Vista(r, hechosMapper.toResponse(r, vigentes(implicados.findByReposicionIdOrderById(r.id())))));
        }
        return ordenados.stream()
                .filter(v -> filtro.incluye(v.hecho().fechaRegistro()))
                .sorted(Comparator.comparing((Vista v) -> v.hecho().getOrdenImportacion(), Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(v -> v.hecho().fechaRegistro()).thenComparing(v -> v.hecho().getCodigo()))
                .map(Vista::dto).toList();
    }

    private List<BienImplicado> vigentes(List<BienImplicado> filas) { return filas.stream().filter(BienImplicado::vigente).toList(); }
    private record Vista(HechoAuditable hecho, Map<String,Object> dto) {}
}
