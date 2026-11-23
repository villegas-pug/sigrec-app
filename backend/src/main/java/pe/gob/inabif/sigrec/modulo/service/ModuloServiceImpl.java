package pe.gob.inabif.sigrec.modulo.service;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.elemento.service.ElementoService;
import pe.gob.inabif.sigrec.elemento.mappers.ElementoResponseMapper;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.modulo.mappers.ModuloCreateMapper;
import pe.gob.inabif.sigrec.modulo.mappers.ModuloUpdateMapper;
import pe.gob.inabif.sigrec.modulo.mappers.ModuloEntityMapper;
import pe.gob.inabif.sigrec.modulo.mappers.ModuloResponseMapper;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.modulo.dtos.CreateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.UpdateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.centro.service.ReglasJerarquia;
import static pe.gob.inabif.sigrec.centro.service.ReglasJerarquia.*;
import pe.gob.inabif.sigrec.shared.model.Auditable;
import java.util.Locale;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ModuloServiceImpl implements ModuloService {
    private final ModuloRepository modulos;
    private final AmbienteRepository ambientes;
    private final CentroService centroService;
    private final ElementoService evaluaciones;
    private final CatalogoService catalogos;
    private final Acceso acceso;
    private final ModuloCreateMapper createMapper;
    private final ModuloUpdateMapper updateMapper;
    private final ModuloEntityMapper entityMapper;
    private final ModuloResponseMapper responseMapper;
    private final ElementoResponseMapper elementoMapper;

    @Override
    public CambioResponse<ModuloResponse> crear(CreateModuloRequest request) {
        var datos = createMapper.toModel(request);
        if (datos.carId() == null) throw error(HttpStatus.BAD_REQUEST, "Seleccione un centro.");
        acceso.accionCentro("modulo.registrar", datos.carId());
        var centro = centroService.bloquear(datos.carId());
        exigirVigencia(centro.vigente(), "El centro está anulado.");
        var modulo = new Modulo();
        modulo.setCentro(centro);
        return guardarModulo(modulo, siguiente(centro.codigo() + "-M", modulos::existsByCodigo), datos, acceso.actor(), true);
    }

    @Override
    public CambioResponse<ModuloResponse> editar(String codigo, UpdateModuloRequest request) {
        var datos = updateMapper.toModel(request);
        var modulo = modulo(codigo);
        var centro = modulo.centro();
        acceso.accionCentro("modulo.actualizar", centro.codigo());
        centroService.bloquear(centro.codigo());
        modulos.refresh(modulo);
        exigirVigencia(modulo.vigente() && modulo.centro().vigente(), "El módulo o el centro está anulado.");
        return guardarModulo(modulo, codigo, datos, acceso.actor(), false);
    }

    @Override
    public ModuloResponse cambiarEstado(String codigo, String motivo) {
        var modulo = modulo(codigo);
        var codigoCentro = modulo.centro().codigo();
        acceso.accionCentro("modulo.anular", codigoCentro);
        var centro = centroService.bloquear(codigoCentro);
        modulos.refresh(modulo);
        var actor = acceso.actor();
        if (motivo == null) {
            exigirVigencia(centro.vigente(), "Reactive primero el centro.");
            if (!modulo.vigente()) modulo.reactivar(actor);
        } else if (modulo.vigente()) {
            if (ambientes.findByModuloId(modulo.id()).stream().anyMatch(Ambiente::vigente)) {
                throw error(HttpStatus.CONFLICT, "El módulo tiene ambientes vigentes.");
            }
            modulo.anular(actor, motivo.strip());
        }
        return responseMapper.toResponse(modulo);
    }

    private CambioResponse<ModuloResponse> guardarModulo(Modulo m, String codigo, ModuloDatos datos, Usuario actor, boolean alta) {
        entityMapper.fromModelToEntity(datos, m);
        m.setNombre(datos.nombre().strip());
        // La capacidad es opcional para casas; para módulos comunes se fuerza a nula (SPEC 020/043).
        m.setCodigo(codigo);
        m.setTipo(datos.tipo().toUpperCase(Locale.ROOT));
        m.setCapacidad("casa".equals(datos.tipo()) ? datos.capacidad() : null);
        m.setCondicion(condicion(datos.condicion()));
        if (alta) m.registrar(actor);
        else m.actualizar(actor);
        modulos.save(m);
        var filas = evaluaciones.reemplazar(null, m, null, datos.estadoElementos(), datos.elementosAdicionales(), actor);
        return new CambioResponse<>(responseMapper.toResponse(m), filas.stream().map(elementoMapper::toResponse).toList());
    }

    private pe.gob.inabif.sigrec.catalogo.model.Catalogo condicion(String codigo) { return catalogos.obtener("CONDICION", codigo); }
    private Modulo modulo(String id) { return modulos.findByCodigo(id).orElseThrow(ReglasJerarquia::noDisponible); }
}
