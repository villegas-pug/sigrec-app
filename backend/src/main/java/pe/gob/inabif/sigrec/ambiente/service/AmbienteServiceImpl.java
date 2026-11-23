package pe.gob.inabif.sigrec.ambiente.service;

import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.elemento.service.ElementoService;
import pe.gob.inabif.sigrec.elemento.mappers.ElementoResponseMapper;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.ambiente.mappers.AmbienteCreateMapper;
import pe.gob.inabif.sigrec.ambiente.mappers.AmbienteUpdateMapper;
import pe.gob.inabif.sigrec.ambiente.mappers.AmbienteEntityMapper;
import pe.gob.inabif.sigrec.ambiente.mappers.AmbienteResponseMapper;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import pe.gob.inabif.sigrec.ambiente.dtos.CreateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.UpdateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
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
public class AmbienteServiceImpl implements AmbienteService {
    private final AmbienteRepository ambientes;
    private final ModuloRepository modulos;
    private final CentroService centroService;
    private final ElementoService evaluaciones;
    private final CatalogoService catalogos;
    private final Acceso acceso;
    private final ReglasBien inventario;
    private final AmbienteCreateMapper createMapper;
    private final AmbienteUpdateMapper updateMapper;
    private final AmbienteEntityMapper entityMapper;
    private final AmbienteResponseMapper responseMapper;
    private final ElementoResponseMapper elementoMapper;

    @Override
    public CambioResponse<AmbienteResponse> crear(CreateAmbienteRequest request) {
        var datos = createMapper.toModel(request);
        var modulo = modulo(datos.moduloId());
        var codigoCentro = modulo.centro().codigo();
        acceso.accionCentro("ambiente.registrar", codigoCentro);
        var centro = centroService.bloquear(codigoCentro);
        modulos.refresh(modulo);
        exigirVigencia(centro.vigente() && modulo.vigente(), "Elija un módulo vigente.");
        var ambiente = new Ambiente();
        return guardarAmbiente(ambiente, siguiente(centro.codigo() + "-A", ambientes::existsByCodigo),
                modulo, datos, acceso.actor(), true);
    }

    @Override
    public CambioResponse<AmbienteResponse> editar(String codigo, UpdateAmbienteRequest request) {
        var datos = updateMapper.toModel(request);
        var ambiente = ambiente(codigo);
        var origen = ambiente.modulo().centro().codigo();
        acceso.accionCentro("ambiente.actualizar", origen);
        var centro = centroService.bloquear(origen);
        ambientes.refresh(ambiente);
        var destino = modulo(datos.moduloId());
        if (!destino.centro().codigo().equals(origen)) throw error(HttpStatus.BAD_REQUEST, "El módulo debe pertenecer al mismo centro.");
        exigirVigencia(ambiente.vigente() && centro.vigente() && destino.vigente(), "Elija un módulo vigente.");
        return guardarAmbiente(ambiente, codigo, destino, datos, acceso.actor(), false);
    }

    @Override
    public AmbienteResponse cambiarEstado(String codigo, String motivo) {
        var ambiente = ambiente(codigo);
        var codigoCentro = ambiente.modulo().centro().codigo();
        acceso.accionCentro("ambiente.anular", codigoCentro);
        var centro = centroService.bloquear(codigoCentro);
        ambientes.refresh(ambiente);
        var actor = acceso.actor();
        if (motivo == null) {
            exigirVigencia(centro.vigente() && ambiente.modulo().vigente(), "Reactive primero el centro y el módulo.");
            if (!ambiente.vigente()) ambiente.reactivar(actor);
        } else if (ambiente.vigente()) {
            if (inventario.impideAnularAmbiente(ambiente)) throw error(HttpStatus.CONFLICT, "El ambiente tiene bienes por resolver.");
            ambiente.anular(actor, motivo.strip());
        }
        return responseMapper.toResponse(ambiente);
    }

    @Override
    public void importar(AmbienteDatos datos, String codigo, Usuario actor) {
        if (ambientes.findByCodigo(codigo).isEmpty()) guardarAmbiente(new Ambiente(), codigo, modulo(datos.moduloId()), datos, actor, true);
    }

    private CambioResponse<AmbienteResponse> guardarAmbiente(Ambiente a, String codigo, Modulo modulo, AmbienteDatos datos, Usuario actor, boolean alta) {
        entityMapper.fromModelToEntity(datos, a);
        a.setNombre(datos.nombre().strip());
        if (datos.ultimoPintado() != null && datos.ultimoPintado().isAfter(YearMonth.now(java.time.ZoneId.of("America/Lima")))) {
            throw error(HttpStatus.BAD_REQUEST, "El último pintado no puede ser futuro.");
        }
        a.setCodigo(codigo);
        a.setModulo(modulo);
        a.setCondicion(condicion(datos.condicion()));
        a.setUltimoPintado(datos.ultimoPintado() == null ? null : datos.ultimoPintado().atDay(1));
        if (alta) a.registrar(actor);
        else a.actualizar(actor);
        ambientes.save(a);
        var filas = evaluaciones.reemplazar(null, null, a, datos.estadoElementos(), null, actor);
        return new CambioResponse<>(responseMapper.toResponse(a), filas.stream().map(elementoMapper::toResponse).toList());
    }

    private pe.gob.inabif.sigrec.catalogo.model.Catalogo condicion(String codigo) { return catalogos.obtener("CONDICION", codigo); }
    private Modulo modulo(String id) { return modulos.findByCodigo(id).orElseThrow(ReglasJerarquia::noDisponible); }
    private Ambiente ambiente(String id) { return ambientes.findByCodigo(id).orElseThrow(ReglasJerarquia::noDisponible); }
}
