package pe.gob.inabif.sigrec.centro.service;

import pe.gob.inabif.sigrec.centro.dtos.JerarquiaResponse;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.elemento.model.Elemento;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.repository.UnidadOrganicaRepository;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.elemento.repository.ElementoRepository;
import pe.gob.inabif.sigrec.centro.mappers.CentroResponseMapper;
import pe.gob.inabif.sigrec.modulo.mappers.ModuloResponseMapper;
import pe.gob.inabif.sigrec.ambiente.mappers.AmbienteResponseMapper;
import pe.gob.inabif.sigrec.elemento.mappers.ElementoResponseMapper;
import java.util.*;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JerarquiaQueries {
    private final CentroRepository centros;
    private final UnidadOrganicaRepository unidades;
    private final ModuloRepository modulos;
    private final AmbienteRepository ambientes;
    private final ElementoRepository elementos;
    private final Acceso acceso;
    private final CentroResponseMapper centrosMapper;
    private final ModuloResponseMapper modulosMapper;
    private final AmbienteResponseMapper ambientesMapper;
    private final ElementoResponseMapper elementosMapper;

    @Transactional(readOnly = true)
    public JerarquiaResponse consultar() {
        var asignaciones = acceso.consultaCentros();
        var acotados = asignaciones.stream().filter(a -> a.centro() != null).map(a -> a.centro().codigo()).distinct().toList();
        var cars = asignaciones.stream().anyMatch(Acceso.Asignacion::global)
                ? centros.findAllByOrderById() : centros.findByCodigoInOrderById(acotados);
        if (cars.isEmpty()) return new JerarquiaResponse(List.of(), List.of(), List.of(), List.of());
        var carIds = cars.stream().map(Centro::id).toList();
        var mods = modulos.findByCentroIdInOrderById(carIds);
        var modIds = mods.stream().map(Modulo::id).toList();
        var spaces = modIds.isEmpty() ? List.<Ambiente>of() : ambientes.findByModuloIdInOrderById(modIds);
        var ambienteIds = spaces.stream().map(Ambiente::id).toList();

        var elements = Stream.of(elementos.findByCentroIdInOrderById(carIds),
                        modIds.isEmpty() ? List.<Elemento>of() : elementos.findByModuloIdInOrderById(modIds),
                        ambienteIds.isEmpty() ? List.<Elemento>of() : elementos.findByAmbienteIdInOrderById(ambienteIds))
                .flatMap(Collection::stream).filter(Elemento::vigente).map(elementosMapper::toResponse).toList();
        var resumenes = unidades.porIds(cars.stream().map(Centro::getUnidadOrganicaId).filter(Objects::nonNull).distinct().toList());
        var respuestasCentro = cars.stream().map(c -> centrosMapper.toResponse(c,
                c.getUnidadOrganicaId() == null ? null : resumenes.get(c.getUnidadOrganicaId()))).toList();
        return new JerarquiaResponse(respuestasCentro, mods.stream().map(modulosMapper::toResponse).toList(),
                spaces.stream().map(ambientesMapper::toResponse).toList(), elements);
    }
}
