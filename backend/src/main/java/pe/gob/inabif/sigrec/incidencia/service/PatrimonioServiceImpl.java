package pe.gob.inabif.sigrec.incidencia.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.bien.dtos.BienResponse;
import pe.gob.inabif.sigrec.bien.mappers.BienResponseMapper;
import pe.gob.inabif.sigrec.bien.model.*;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.incidencia.dtos.*;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import java.util.*;
import java.util.stream.Collectors;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@RequiredArgsConstructor
@Transactional
public class PatrimonioServiceImpl implements PatrimonioService {
    private final BajaRepository bajas;
    private final ReposicionRepository reposiciones;
    private final BienImplicadoRepository implicados;
    private final BienRepository bienes;
    private final HistorialBienRepository historial;
    private final BienResponseMapper bienMapper;
    private final ReglasBien reglas;
    private final CatalogoService catalogos;
    private final Acceso acceso;

    @Override
    public IncidenciaResponse darDeBaja(String rotulo, IncidenciaOperaciones.Baja datos) {
        var bien = reglas.bloquear("bien.baja", rotulo);
        reglas.exigirActivo(bien);
        var actor = acceso.actor();
        var baja = new Baja();
        baja.asignarCodigo("EV-");
        baja.setBien(bien);
        baja.setAmbiente(bien.getAmbiente());
        baja.setFecha(fecha(datos.fecha()));
        baja.setMotivo(datos.motivo().strip());
        baja.setTitulo("Baja: " + baja.getMotivo());
        baja.setDetalle(datos.detalle());
        baja.registrar(actor);
        bajas.save(baja);
        for (var componente : reglas.componentes(bien).stream().filter(reglas::activo).toList()) {
            var fila = vincular(componente, "COMPONENTE", actor);
            fila.setBaja(baja);
            implicados.save(fila);
        }
        return new IncidenciaResponse(baja.getCodigo(), baja.getTitulo());
    }

    @Override
    public BienResponse reponer(String rotulo, IncidenciaOperaciones.Reponer datos) {
        var anterior = reglas.bloquear("bien.reposicion", rotulo);
        var baja = reglas.baja(anterior).filter(b -> anterior.vigente())
                .orElseThrow(() -> conflicto("Solo se repone un bien dado de baja."));
        if (hayReposicion(baja)) throw conflicto("El bien ya tiene una reposición vigente.");
        var fecha = fecha(datos.fecha());
        if (fecha.isBefore(baja.getFecha())) throw invalido("La reposición no puede ser anterior a la baja.");
        var rotuloNuevo = datos.rotulo().strip();
        if (bienes.findByRotulo(rotuloNuevo).isPresent()) throw conflicto("Ya existe un bien con ese rótulo.");
        reglas.exigirAmbienteVigente(anterior.getAmbiente());
        var hijos = reglas.componentes(anterior).stream().filter(reglas::activo)
                .collect(Collectors.toMap(Bien::getRotulo, b -> b, (a, b) -> a, LinkedHashMap::new));
        var ids = datos.componentesIds() == null ? List.<String>of() : datos.componentesIds();
        if (new HashSet<>(ids).size() != ids.size() || !hijos.keySet().containsAll(ids)) {
            throw invalido("Seleccione componentes activos del bien dado de baja.");
        }

        var actor = acceso.actor();
        var nuevo = nuevoBien(anterior, datos, rotuloNuevo, actor);
        var reposicion = new Reposicion();
        reposicion.asignarCodigo("EV-");
        reposicion.setBaja(baja);
        reposicion.setBienNuevo(nuevo);
        reposicion.setTitulo("Reposición de " + anterior.getRotulo());
        reposicion.setFecha(fecha);
        reposicion.setDetalle(sustento(ids.size()));
        reposicion.registrar(actor);
        reposiciones.save(reposicion);

        var revisiones = implicados.findByBajaIdOrderById(baja.id());
        for (var id : hijos.keySet()) {
            if (!ids.contains(id)) continue;
            var hijo = hijos.get(id);
            var fila = vincular(hijo, "REASIGNADO", actor);
            fila.setReposicion(reposicion);
            implicados.save(fila);
            hijo.setPrincipal(nuevo);
            hijo.actualizar(actor);
            revisiones.stream().filter(r -> r.vigente() && r.getBien().id().equals(hijo.id()))
                    .forEach(r -> { r.setResolucion("REPOSICION"); r.setFechaResolucion(fecha); r.actualizar(actor); });
        }
        return bienMapper.toResponse(nuevo);
    }

    private Bien nuevoBien(Bien anterior, IncidenciaOperaciones.Reponer datos, String rotulo, Usuario actor) {
        var nuevo = new Bien();
        nuevo.setRotulo(rotulo);
        nuevo.setNombre(datos.nombre().strip());
        nuevo.setAmbiente(anterior.getAmbiente());
        nuevo.setTipo(anterior.getTipo());
        nuevo.setCategoria(anterior.getCategoria());
        nuevo.setCodigoPatrimonial(datos.codigoPatrimonial());
        nuevo.setDescripcion(anterior.getDescripcion());
        nuevo.setCantidad(anterior.getCantidad());
        nuevo.setPrincipal(anterior.getPrincipal());
        nuevo.setPosicion(anterior.getPosicion());
        nuevo.setCondicion(catalogos.obtener("CONDICION", "bueno"));
        var adq = FechaAdquisicion.interpretar(datos.fechaAdquisicion());
        nuevo.setFechaAdquisicion(adq.fecha());
        nuevo.setPrecisionAdquisicion(adq.precision());
        nuevo.setCosto(datos.costo());
        nuevo.setVidaUtilAnios(datos.vidaUtilAnios());
        nuevo.registrar(actor);
        return bienes.save(nuevo);
    }

    private BienImplicado vincular(Bien hijo, String rol, Usuario actor) {
        var fila = new BienImplicado();
        fila.setRol(rol);
        fila.setBien(hijo);
        fila.setPosicion(hijo.getPosicion());
        fila.registrar(actor);
        return fila;
    }

    @Override
    public void anularBaja(String codigo, String motivo) {
        var baja = bajas.findByCodigo(codigo).orElseThrow(ReglasBien::noDisponible);
        reglas.bloquear("baja.anular", reglas.centro(baja.getBien()));
        bajas.refresh(baja);
        if (!baja.vigente() || !baja.getBien().vigente() || hayReposicion(baja)) {
            throw conflicto("La baja no se puede anular mientras tenga dependencias vigentes.");
        }
        baja.anular(acceso.actor(), motivo.strip());
    }

    @Override
    public void anularReposicion(String codigo, String motivo) {
        var reposicion = reposiciones.findByCodigo(codigo).orElseThrow(ReglasBien::noDisponible);
        var centro = reglas.centro(reposicion.getBienNuevo());
        reglas.bloquear("reposicion.anular", centro);
        reposiciones.refresh(reposicion);
        var nuevo = reposicion.getBienNuevo();
        bienes.refresh(nuevo);
        var traslado = implicados.findByReposicionIdOrderById(reposicion.id()).stream().filter(BienImplicado::vigente).toList();
        var anteriores = traslado.stream().map(i -> i.getBien().id()).collect(Collectors.toSet());
        if (!reposicion.vigente() || !reglas.activo(nuevo)
                || reglas.componentes(nuevo).stream().anyMatch(b -> reglas.activo(b) && !anteriores.contains(b.id()))
                || tieneHechos(nuevo, centro.codigo())) {
            throw conflicto("El reemplazo tiene dependencias que impiden anular la reposición.");
        }
        var actor = acceso.actor();
        var baja = reposicion.getBaja();
        var componentes = implicados.findByBajaIdOrderById(baja.id());
        for (var fila : traslado) {
            var hijo = fila.getBien();
            if (!hijo.vigente() || hijo.getPrincipal() == null || !hijo.getPrincipal().id().equals(nuevo.id())
                    || !hijo.getAmbiente().id().equals(baja.getBien().getAmbiente().id())) {
                throw conflicto("Cambió la asociación de un componente trasladado.");
            }
            hijo.setPrincipal(baja.getBien());
            hijo.setPosicion(fila.getPosicion());
            hijo.actualizar(actor);
            componentes.stream().filter(c -> c.getBien().id().equals(hijo.id()) && "REPOSICION".equals(c.getResolucion()))
                    .forEach(c -> { c.setResolucion(null); c.setFechaResolucion(null); c.actualizar(actor); });
        }
        nuevo.anular(actor, motivo.strip());
        reposicion.anular(actor, motivo.strip());
    }

    private boolean tieneHechos(Bien bien, String centro) {
        return historial.findByBienAmbienteModuloCentroCodigoInOrderById(List.of(centro)).stream()
                .anyMatch(h -> h.vigente() && !h.isCargaInicial() && (h.getBien().id().equals(bien.id())
                        || (h.getPrincipalNuevo() != null && h.getPrincipalNuevo().id().equals(bien.id()))))
                || implicados.findByBienIdOrderById(bien.id()).stream().anyMatch(i -> i.vigente()
                        && i.getIncidente() != null && i.getIncidente().vigente() && !"NOVEDAD".equals(i.getIncidente().getClase()));
    }

    private boolean hayReposicion(Baja baja) {
        return reposiciones.findByBajaId(baja.id()).stream().anyMatch(Reposicion::vigente);
    }

    private String sustento(int n) {
        return switch (n) {
            case 0 -> "Alta por reposición.";
            case 1 -> "Alta por reposición. Se traslada 1 componente al bien nuevo.";
            default -> "Alta por reposición. Se trasladan " + n + " componentes al bien nuevo.";
        };
    }
}
