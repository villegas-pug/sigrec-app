package pe.gob.inabif.sigrec.servicio.service;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.servicio.dtos.*;
import pe.gob.inabif.sigrec.servicio.mappers.*;
import pe.gob.inabif.sigrec.servicio.model.*;
import pe.gob.inabif.sigrec.servicio.repository.*;
import pe.gob.inabif.sigrec.shared.model.Hoy;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ServicioServiceImpl implements ServicioService {
    private static final String RUTA = "servicios";
    private static final Map<String, String> ESTADOS = Map.of("PAGADO", "Pagado", "PENDIENTE", "Pendiente", "SIN_INFO", "Sin información");
    private static final Set<String> SUMINISTRO = Set.of("INTERRUPCION", "RESTABLECIMIENTO");
    private final ServicioRepository servicios;
    private final PeriodoRepository periodos;
    private final HechoServicioRepository hechos;
    private final CentroService centros;
    private final CatalogoService catalogos;
    private final Acceso acceso;
    private final ServicioEntityMapper entityMapper;
    private final ServicioCreateMapper createMapper;
    private final ServicioUpdateMapper updateMapper;
    private final ServicioResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ServicioResponse> listar() {
        var grants = acceso.consultaCentros(RUTA);
        var filas = grants.stream().anyMatch(Acceso.Asignacion::global) ? servicios.findAllByOrderById()
                : servicios.findByCentroCodigoInOrderById(grants.stream().map(a -> a.centro().codigo()).distinct().toList());
        return filas.stream().map(this::responder).toList();
    }

    @Override
    public ServicioResponse crear(CreateServicioRequest request) {
        var centro = bloquearCentro(request.carId(), "servicio.registrar");
        if (!centro.vigente()) throw conflicto("El centro está anulado.");
        var tipo = catalogos.obtener("TIPO_SERVICIO", request.tipo());
        exigirTipoLibre(centro, tipo);
        var base = "SRV-" + centro.codigo() + "-" + tipo.codigo().toUpperCase(Locale.ROOT);
        base = base.substring(0, Math.min(35, base.length()));
        var codigo = base;
        for (int i = 2; servicios.existsByCodigo(codigo); i++) codigo = base + "-" + i;
        var servicio = new Servicio();
        servicio.setCodigo(codigo);
        servicio.setCentro(centro);
        servicio.setTipo(tipo);
        copiar(servicio, createMapper.toModel(request), List.of());
        servicio.registrar(acceso.actor());
        return responder(servicios.save(servicio));
    }

    @Override
    public ServicioResponse editar(String codigo, UpdateServicioRequest request) {
        var servicio = bloquear(codigo, "servicio.actualizar");
        exigirVigente(servicio);
        copiar(servicio, request, periodos.findByServicioIdOrderByAnioAscNumeroAsc(servicio.id()));
        servicio.actualizar(acceso.actor());
        return responder(servicio);
    }

    private void copiar(Servicio destino, UpdateServicioRequest request, List<Periodo> filas) {
        if (request.periodicidad() != null) {
            var duracion = Periodicidad.meses(request.periodicidad());
            if (duracion != destino.getMeses() && filas.stream().anyMatch(p ->
                    p.vigente() && p.getMeses() == destino.getMeses() && !"SIN_INFO".equals(p.getSituacion()))) {
                throw conflicto("La periodicidad está bloqueada mientras haya períodos informados.");
            }
            destino.setMeses(duracion);
        }
        entityMapper.fromModelToEntity(request.datos(), destino);
        aplicarInicio(destino, request.datos().inicio());
    }

    private void aplicarInicio(Servicio destino, String inicio) {
        destino.setInicio(null);
        destino.setPrecisionInicio(null);
        if (inicio == null) return;
        try {
            var anual = inicio.length() == 4;
            var fecha = anual ? Year.parse(inicio).atDay(1) : YearMonth.parse(inicio).atDay(1);
            if (fecha.getYear() < 1) throw invalido("Indique un inicio válido para el servicio.");
            destino.setInicio(fecha(fecha));
            destino.setPrecisionInicio(anual ? "ANIO" : "MES");
        } catch (DateTimeParseException error) {
            throw invalido("Indique un año o mes de inicio válido.");
        }
    }

    @Override
    public ServicioResponse cambiarEstado(String codigo, String motivo) {
        var servicio = bloquear(codigo, "servicio.anular");
        if (motivo == null && !servicio.vigente()) {
            if (!servicio.getCentro().vigente()) throw conflicto("El centro está anulado.");
            exigirTipoLibre(servicio.getCentro(), servicio.getTipo());
            servicio.reactivar(acceso.actor());
        } else if (motivo != null && servicio.vigente()) {
            servicio.anular(acceso.actor(), motivo.strip());
        }
        return responder(servicio);
    }

    private void exigirTipoLibre(Centro centro, Catalogo tipo) {
        if (servicios.existsByCentroIdAndTipoIdAndEstadoAndEliminado(centro.id(), tipo.id(), 1, 0)) {
            throw conflicto("Ya hay un servicio vigente de ese tipo en el centro.");
        }
    }

    @Override
    public ServicioResponse informarPeriodo(String codigo, int anio, int numero, UpdatePeriodoRequest request) {
        var servicio = bloquear(codigo, "servicio.periodo");
        exigirVigente(servicio);
        if (anio < 1 || anio > 9999 || numero < 1 || numero > 12 / servicio.getMeses()) {
            throw invalido("Período no válido para la periodicidad del servicio.");
        }
        var estado = codigo(request.estado());
        var pago = request.pago();
        if ("PAGADO".equals(estado)) {
            if (pago == null) throw invalido("Complete fecha válida, importe positivo y sustento del pago.");
            fecha(pago.fecha());
        }
        var actor = acceso.actor();
        var periodo = periodos.findByServicioIdAndAnioAndMesesAndNumero(servicio.id(), anio, servicio.getMeses(), numero)
                .orElseGet(() -> periodo(servicio, anio, numero, actor));
        var anterior = periodo.getSituacion();
        datosPeriodo(periodo, estado, request);
        if (periodo.id() == null) periodos.save(periodo);
        else periodo.actualizar(actor);
        if ("PAGADO".equals(estado) && !anterior.equals(estado)) {
            registrarHechoPeriodo(periodo, "PAGO", pago.fecha(), "Pago informado del período " + Periodicidad.etiqueta(periodo)
                    + " · " + soles(pago.importe()) + ".", null, null, actor);
        } else if (!anterior.equals(estado) && ("PAGADO".equals(anterior)
                || "PENDIENTE".equals(anterior) && "SIN_INFO".equals(estado))) {
            var texto = "Corrección del período " + Periodicidad.etiqueta(periodo) + ": de " + ESTADOS.get(anterior)
                    + " a " + ESTADOS.get(estado) + ".";
            registrarHechoPeriodo(periodo, "CORRECCION", Hoy.fecha(), texto, anterior, estado, actor);
        }
        return responder(servicio);
    }

    private String soles(BigDecimal importe) {
        var simbolos = new java.text.DecimalFormatSymbols(Locale.ROOT);
        simbolos.setGroupingSeparator('\u00a0');
        simbolos.setDecimalSeparator(',');
        return "S/ " + new java.text.DecimalFormat("#,##0.##", simbolos).format(importe);
    }

    private void registrarHechoPeriodo(Periodo p, String tipo, LocalDate dia, String texto,
                                       String anterior, String nueva, Usuario actor) {
        var hecho = new HechoServicio();
        hecho.setPeriodo(p);
        hecho.setTipo(tipo);
        hecho.setFecha(dia);
        hecho.setDetalle(texto);
        hecho.setAnterior(anterior);
        hecho.setNueva(nueva);
        registrarHecho(hecho, actor);
    }

    @Override
    public ServicioResponse guardarHecho(String codigo, String hechoCodigo, HechoServicioRequest request) {
        var servicio = bloquear(codigo, hechoCodigo == null ? "hecho.registrar" : "hecho.actualizar");
        exigirVigente(servicio);
        var datos = updateMapper.toModel(request);
        var tipo = codigo(datos.getTipo());
        var dia = fecha(datos.getFecha());
        var actor = acceso.actor();
        if (hechoCodigo == null) {
            if (!SUMINISTRO.contains(tipo)) throw invalido("El hecho se origina en un período del servicio.");
            datos.setServicio(servicio);
            datos.setTipo(tipo);
            datos.setFecha(dia);
            registrarHecho(datos, actor);
        } else {
            var hecho = buscarHecho(servicio, hechoCodigo);
            if (!hecho.vigente()) throw conflicto("El hecho está anulado.");
            if (!tipo.equals(hecho.getTipo()) && !(SUMINISTRO.contains(tipo) && SUMINISTRO.contains(hecho.getTipo()))) {
                throw invalido("El tipo del hecho se conserva.");
            }
            hecho.setTipo(tipo);
            hecho.setFecha(dia);
            hecho.setDetalle(datos.getDetalle());
            hecho.actualizar(actor);
        }
        return responder(servicio);
    }

    @Override
    public ServicioResponse cambiarEstadoHecho(String codigo, String hechoCodigo, String motivo) {
        var servicio = bloquear(codigo, "hecho.anular");
        var hecho = buscarHecho(servicio, hechoCodigo);
        if (motivo == null && !hecho.vigente()) {
            exigirVigente(servicio);
            hecho.reactivar(acceso.actor());
        } else if (motivo != null && hecho.vigente()) hecho.anular(acceso.actor(), motivo.strip());
        return responder(servicio);
    }

    private HechoServicio buscarHecho(Servicio servicio, String codigo) {
        return hechos.findByCodigo(codigo).filter(h -> h.titular().id().equals(servicio.id()))
                .orElseThrow(pe.gob.inabif.sigrec.bien.service.ReglasBien::noDisponible);
    }

    private void registrarHecho(HechoServicio hecho, Usuario actor) {
        hecho.asignarCodigo("HS-");
        hecho.registrar(actor);
        hechos.save(hecho);
    }

    private Centro bloquearCentro(String codigo, String permiso) {
        acceso.accionCentro(RUTA, permiso, codigo);
        return centros.bloquear(codigo);
    }

    private Servicio bloquear(String codigo, String permiso) {
        var centro = servicios.centroDe(codigo).orElseThrow(pe.gob.inabif.sigrec.bien.service.ReglasBien::noDisponible);
        bloquearCentro(centro, permiso);
        return servicios.findByCodigo(codigo).orElseThrow(pe.gob.inabif.sigrec.bien.service.ReglasBien::noDisponible);
    }

    private void exigirVigente(Servicio servicio) {
        if (!servicio.vigente() || !servicio.getCentro().vigente()) throw conflicto("El servicio no está vigente.");
    }

    private ServicioResponse responder(Servicio s) {
        return responseMapper.toResponse(s, periodos.findByServicioIdOrderByAnioAscNumeroAsc(s.id()), hechos.listarPorServicio(s.id()));
    }

    public static Periodo periodo(Servicio servicio, int anio, int numero, Usuario actor) {
        var periodo = new Periodo();
        periodo.setServicio(servicio);
        periodo.setAnio(anio);
        periodo.setNumero(numero);
        periodo.setMeses(servicio.getMeses());
        periodo.registrar(actor);
        return periodo;
    }

    public static void datosPeriodo(Periodo p, String estado, UpdatePeriodoRequest datos) {
        var pendiente = "PENDIENTE".equals(estado);
        var pago = "PAGADO".equals(estado) ? datos.pago() : null;
        p.setSituacion(estado);
        p.setVence(pendiente ? datos.vence() : null);
        p.setMotivoPendiente(pendiente ? datos.motivo() : null);
        p.setDetalle(pendiente ? datos.detalle() : null);
        p.setPagoFecha(pago == null ? null : pago.fecha());
        p.setPagoImporte(pago == null ? null : pago.importe());
        p.setPagoSustento(pago == null ? null : pago.sustento().strip());
    }
}
