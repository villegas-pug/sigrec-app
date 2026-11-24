package pe.gob.inabif.sigrec.centro.service;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.elemento.service.ElementoService;
import pe.gob.inabif.sigrec.elemento.mappers.ElementoResponseMapper;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.repository.UnidadOrganicaRepository;
import pe.gob.inabif.sigrec.servicio.repository.ServicioRepository;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.centro.mappers.CentroCreateMapper;
import pe.gob.inabif.sigrec.centro.mappers.CentroUpdateMapper;
import pe.gob.inabif.sigrec.centro.mappers.CentroEntityMapper;
import pe.gob.inabif.sigrec.centro.mappers.CentroResponseMapper;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.centro.dtos.CreateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.UpdateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse;
import static pe.gob.inabif.sigrec.centro.service.ReglasJerarquia.*;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CentroServiceImpl implements CentroService {
    private final CentroRepository centros;
    private final UnidadOrganicaRepository unidades;
    private final ServicioRepository servicios;
    private final VehiculoRepository vehiculos;
    private final ModuloRepository modulos;
    private final ElementoService evaluaciones;
    private final CatalogoService catalogos;
    private final Acceso acceso;
    private final CentroCreateMapper createMapper;
    private final CentroUpdateMapper updateMapper;
    private final CentroEntityMapper entityMapper;
    private final CentroResponseMapper responseMapper;
    private final ElementoResponseMapper elementoMapper;

    @Override
    public CambioResponse<CentroResponse> crear(CreateCentroRequest request) {
        var datos = createMapper.toModel(request);
        acceso.accionCentro("centro.registrar", datos.id());
        if (datos.id() == null || datos.inmueble().direccion() == null || datos.inmueble().direccion().isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, "Indique el código y la dirección del centro.");
        }
        if (centros.findByCodigo(datos.id()).isPresent()) throw error(HttpStatus.CONFLICT, "El código del centro ya existe.");
        return guardarCentro(new Centro(), datos.id(), datos, request.unidadOrganicaId(), acceso.actor(), true);
    }

    @Override
    public CambioResponse<CentroResponse> editar(String codigo, UpdateCentroRequest request) {
        var datos = updateMapper.toModel(request);
        acceso.accionCentro("centro.actualizar", codigo);
        var centro = bloquear(codigo);
        exigirVigencia(centro.vigente(), "El centro está anulado.");
        return guardarCentro(centro, codigo, datos, request.unidadOrganicaId(), acceso.actor(), false);
    }

    @Override
    public CentroResponse cambiarEstado(String codigo, String motivo) {
        acceso.accionCentro("centro.anular", codigo);
        var centro = bloquear(codigo);
        var actor = acceso.actor();
        if (motivo == null) {
            if (!centro.vigente()) centro.reactivar(actor);
        } else if (centro.vigente()) {
            if (modulos.findByCentroId(centro.id()).stream().anyMatch(Modulo::vigente)) {
                throw error(HttpStatus.CONFLICT, "El centro tiene módulos vigentes.");
            }
            if (servicios.existsByCentroIdAndEstadoAndEliminado(centro.id(), 1, 0)) {
                throw error(HttpStatus.CONFLICT, "El centro tiene servicios vigentes.");
            }
            if (vehiculos.existsByCentroIdAndEstadoAndEliminado(centro.id(), 1, 0)) {
                throw error(HttpStatus.CONFLICT, "El centro tiene vehículos vigentes.");
            }
            centro.anular(actor, motivo.strip());
        }
        return responseMapper.toResponse(centro, unidades.porId(centro.getUnidadOrganicaId()));
    }

    private CambioResponse<CentroResponse> guardarCentro(Centro c, String codigo, CentroDatos datos, Long unidadId,
                                                        Usuario actor, boolean alta) {
        var unidad = resolverUnidad(c, unidadId, alta);
        entityMapper.fromModelToEntity(datos, c);
        c.setNombre(datos.nombre().strip());
        var i = datos.inmueble();
        var k = i.construccion();
        c.setCodigo(codigo);
        c.setCondicionInmueble(i.condicion().toUpperCase(Locale.ROOT));
        c.setArrendador("alquilado".equals(i.condicion()) ? i.arrendador() : null);
        c.setContratoHasta("alquilado".equals(i.condicion()) ? i.contratoHasta() : null);
        if (k == null || k.antiguedadNota() != null || alta) c.setAntiguedadNota(k == null ? null : k.antiguedadNota());
        c.setCondicion(condicion(k == null ? null : k.estado()));
        if (alta) c.registrar(actor);
        c.actualizar(actor);
        centros.save(c);
        var filas = evaluaciones.reemplazar(c, null, null, k == null ? null : k.estadoElementos(),
                k == null ? null : k.elementosAdicionales(), actor);
        return new CambioResponse<>(responseMapper.toResponse(c, unidad), filas.stream().map(elementoMapper::toResponse).toList());
    }

    private UnidadOrganicaResponse resolverUnidad(Centro centro, Long nueva, boolean alta) {
        var actual = centro.getUnidadOrganicaId();
        if (alta && nueva == null) throw error(HttpStatus.BAD_REQUEST, "Seleccione una unidad orgánica.");
        if (nueva == null || nueva.equals(actual)) return unidades.porId(actual);

        var unidad = unidades.porId(nueva);
        if (unidad == null || !unidad.elegible()) {
            throw error(HttpStatus.BAD_REQUEST, "Seleccione una unidad orgánica activa y no eliminada.");
        }
        if (unidades.vinculada(nueva)) {
            throw error(HttpStatus.CONFLICT, "La unidad orgánica ya está vinculada a otro centro.");
        }
        centro.setUnidadOrganicaId(nueva);
        return unidad;
    }

    private pe.gob.inabif.sigrec.catalogo.model.Catalogo condicion(String codigo) { return catalogos.obtener("CONDICION", codigo); }
    @Override
    public Centro bloquear(String id) { return centros.bloquear(id).orElseThrow(ReglasJerarquia::noDisponible); }
}
