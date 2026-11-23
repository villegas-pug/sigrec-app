package pe.gob.inabif.sigrec.precio.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.precio.dtos.PrecioResponse;
import pe.gob.inabif.sigrec.precio.dtos.UpdatePrecioRequest;
import pe.gob.inabif.sigrec.precio.mappers.PrecioEntityMapper;
import pe.gob.inabif.sigrec.precio.mappers.PrecioResponseMapper;
import pe.gob.inabif.sigrec.precio.mappers.PrecioUpdateMapper;
import pe.gob.inabif.sigrec.precio.repository.PrecioRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.Hoy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PrecioServiceImpl implements PrecioService {
    private static final Set<String> RUTAS_CON_VALORACION = Set.of("inicio", "centros", "incidencias",
            "necesidades", "inventario", "precios");
    private final PrecioRepository precios;
    private final CatalogoRepository catalogos;
    private final PrecioEntityMapper entityMapper;
    private final PrecioResponseMapper responseMapper;
    private final PrecioUpdateMapper updateMapper;
    private final Acceso acceso;

    @Override
    public List<PrecioResponse> listar() {
        var asignaciones = acceso.concesiones();
        if (asignaciones.stream().noneMatch(a -> !"VEHICULO".equals(a.alcance())
                && a.rutas().stream().anyMatch(RUTAS_CON_VALORACION::contains))) {
            throw new AccessDeniedException("Consulta de precios no autorizada.");
        }
        var puedeConsultarHistorial = asignaciones.stream().anyMatch(this::catalogoGlobal);
        var filas = puedeConsultarHistorial ? precios.listarConHistorial() : precios.listarActuales();
        return filas.stream().collect(Collectors.groupingBy(p -> p.getTipo().codigo()))
                .entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(e -> responseMapper.toResponse(e.getKey(), e.getValue())).toList();
    }

    @Override
    @Transactional
    public PrecioResponse informar(String codigo, UpdatePrecioRequest request) {
        if (acceso.concesiones().stream().noneMatch(a -> catalogoGlobal(a)
                && a.acciones().contains("precio.informar"))) {
            throw new AccessDeniedException("No tiene permiso para informar precios.");
        }
        var valor = updateMapper.toModel(request);
        if (valor.fechaPrecio() != null && valor.fechaPrecio().getYear() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique un mes de cotización válido.");
        }
        if (valor.fechaPrecio() != null && valor.fechaPrecio().isAfter(Hoy.fecha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser posterior a hoy.");
        }
        var tipo = catalogos.bloquear("TIPO_BIEN", codigo.toUpperCase(Locale.ROOT))
                .filter(Catalogo::vigente)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de bien no disponible."));
        var anterior = precios.buscarActual(tipo.id()).orElse(null);
        if (anterior == null || !anterior.coincideCon(valor)) {
            var actor = acceso.actor();
            if (anterior != null) {
                anterior.reemplazar(actor, Hoy.fecha());
                precios.flush();
            }
            var actual = entityMapper.toEntity(valor);
            actual.setTipo(tipo);
            actual.registrar(actor);
            precios.save(actual);
        }
        return responseMapper.toResponse(tipo.codigo(), precios.listarPorTipo(tipo.id()));
    }

    private boolean catalogoGlobal(Acceso.Asignacion asignacion) {
        return asignacion.global() && asignacion.rutas().contains("precios");
    }
}
