package pe.gob.inabif.sigrec.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.bien.dtos.BienDatos;
import pe.gob.inabif.sigrec.bien.mappers.BienEntityMapper;
import pe.gob.inabif.sigrec.bien.model.*;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Locale;

@Component
@Profile("dev")
@Order(10)
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
public class InventarioDemoImport implements ApplicationRunner {
    private final ObjectMapper json;
    private final UsuarioRepository usuarios;
    private final CentroRepository centros;
    private final CatalogoService catalogos;
    private final BienRepository bienes;
    private final BienEntityMapper bienesMapper;
    private final InventarioPrevioRepository previos;
    private final HistorialBienRepository historial;
    private final IncidenteRepository incidentes;
    private final AtencionRepository atenciones;
    private final BajaRepository bajas;
    private final ReposicionRepository reposiciones;
    private final BienImplicadoRepository implicados;
    private final ReglasBien reglas;

    @Override
    @Transactional(rollbackFor = IOException.class)
    public void run(ApplicationArguments args) throws IOException {
        var actor = usuarios.findByCodigo("SIGREC_TECNICO").orElseThrow();
        cargarBienes(leer("bienes"), actor);
        for (var fila : leer("inventario-previo")) cargarPrevio(fila, actor);
        var eventos = leer("eventos");
        for (int orden = 0; orden < eventos.size(); orden++) {
            var fila = eventos.get(orden);
            var tipo = valor(fila, "tipo");
            switch (tipo) {
                case "baja" -> cargarBaja(fila, orden, actor);
                case "reposicion" -> cargarReposicion(fila, orden, actor);
                case "condicion", "verificacion" -> cargarHistorial(fila, orden, actor);
                default -> cargarIncidente(fila, orden, actor);
            }
        }
    }

    private void cargarBienes(JsonNode filas, Usuario actor) throws IOException {
        var nuevos = new HashSet<String>();
        for (var fila : filas) {
            var dto = json.treeToValue(fila, BienDatos.class);
            if (bienes.findByRotulo(dto.id()).isPresent()) continue;
            var b = new Bien();
            bienesMapper.fromModelToEntity(dto, b);
            b.setRotulo(dto.id());
            b.setAmbiente(reglas.ambiente(dto.ambienteId()));
            b.setTipo(catalogos.obtener("TIPO_BIEN", dto.tipoId()));
            b.setCategoria(catalogos.obtener("CATEGORIA_BIEN", dto.categoria()));
            b.setCondicion(catalogos.obtener("CONDICION", dto.condicion()));
            b.setCantidad(dto.cantidad() == null ? 1 : dto.cantidad());
            var fecha = FechaAdquisicion.interpretar(dto.adquisicion() == null ? null : dto.adquisicion().fecha());
            b.setFechaAdquisicion(fecha.fecha());
            b.setPrecisionAdquisicion(fecha.precision());
            b.registrar(actor);
            bienes.save(b);
            nuevos.add(dto.id());
        }
        for (var fila : filas) {
            var id = valor(fila, "id");
            if (!nuevos.contains(id) || !fila.hasNonNull("asociadoA")) continue;
            var dato = fila.path("asociadoA");
            var b = reglas.buscar(id);
            b.setPrincipal(reglas.buscar(valor(dato,"bienId")));
            b.setPosicion(valor(dato, "posicion"));
        }
    }

    private void cargarPrevio(JsonNode fila, Usuario actor) {
        var id = valor(fila, "id");
        if (previos.findByCodigo(id).isPresent()) return;
        var p = new InventarioPrevio();
        p.setCodigo(id);
        p.setCentro(centros.findByCodigo(valor(fila, "carId")).orElseThrow());
        p.setNombre(valor(fila, "nombre"));
        p.setTipo(catalogos.obtener("TIPO_BIEN", valor(fila, "tipoId")));
        p.setCondicion(catalogos.obtener("CONDICION", valor(fila, "condicion")));
        p.setMarcaModelo(valor(fila, "marcaModelo"));
        p.setSerie(valor(fila, "serie"));
        p.setCodigoPatrimonial(valor(fila, "codigoPatrimonial"));
        p.setUbicacionPrevia(valor(fila, "ubicacionPrevia"));
        var adq = FechaAdquisicion.interpretar(valor(fila, "fechaAdquisicion"));
        p.setFechaAdquisicion(adq.fecha());
        p.setPrecisionAdquisicion(adq.precision());
        var bien = valor(fila, "bienId");
        p.setBien(bien == null ? null : reglas.buscar(bien));
        p.registrar(actor);
        previos.save(p);
    }

    private void cargarHistorial(JsonNode fila, int orden, Usuario actor) {
        if (historial.findByCodigo(valor(fila, "id")).isPresent()) return;
        var h = new HistorialBien();
        marca(h, fila, orden, actor);
        h.setTipo(mayus(valor(fila,"tipo")));
        h.setFecha(fecha(fila,"fecha"));
        h.setTitulo(valor(fila, "titulo"));
        h.setDetalle(valor(fila, "detalle"));
        h.setBien(primerBien(fila));
        h.setAmbiente(reglas.ambiente(valor(fila, "ambienteId")));
        h.setCargaInicial(fila.path("cargaInicial").asBoolean());
        h.setResultado(mayus(valor(fila, "resultado")));
        h.setCondicionAnterior(catalogos.obtener("CONDICION", valor(fila, "condicionAnterior")));
        h.setCondicionNueva(catalogos.obtener("CONDICION", valor(fila, "condicionNueva")));
        historial.save(h);
    }

    private void cargarBaja(JsonNode fila, int orden, Usuario actor) {
        if (bajas.findByCodigo(valor(fila, "id")).isPresent()) return;
        var b = new Baja();
        marca(b, fila, orden, actor);
        b.setBien(primerBien(fila));
        b.setAmbiente(reglas.ambiente(valor(fila, "ambienteId")));
        b.setFecha(fecha(fila,"fecha"));
        b.setTitulo(valor(fila,"titulo"));
        b.setMotivo(b.getTitulo().replaceFirst("^Baja(?: por|:)?\\s*", ""));
        b.setDetalle(valor(fila, "detalle"));
        bajas.save(b);
        for (var hijo : fila.path("componentes")) {
            var registro = vincular("COMPONENTE", reglas.buscar(valor(hijo, "bienId")), actor);
            registro.setBaja(b);
            registro.setPosicion(valor(hijo, "posicion"));
            registro.setResolucion(mayus(valor(hijo,"resolucion")));
            registro.setFechaResolucion(fecha(hijo,"fechaResolucion"));
            implicados.save(registro);
        }
    }

    private void cargarReposicion(JsonNode fila, int orden, Usuario actor) {
        if (reposiciones.findByCodigo(valor(fila, "id")).isPresent()) return;
        var r = new Reposicion();
        marca(r, fila, orden, actor);
        r.setBaja(reglas.baja(reglas.buscar(valor(fila, "bienAnteriorId"))).orElseThrow());
        r.setBienNuevo(reglas.buscar(valor(fila, "bienNuevoId")));
        r.setFecha(fecha(fila,"fecha"));
        r.setTitulo(valor(fila, "titulo"));
        r.setDetalle(valor(fila, "detalle"));
        reposiciones.save(r);
        for (var dato : fila.path("trasladados")) {
            var hijo = reglas.buscar(dato.asText());
            var filaHijo = vincular("REASIGNADO", hijo, actor);
            filaHijo.setReposicion(r);
            filaHijo.setPosicion(hijo.getPosicion());
            implicados.save(filaHijo);
        }
    }

    private void cargarIncidente(JsonNode fila, int orden, Usuario actor) {
        if (incidentes.findByCodigo(valor(fila, "id")).isPresent()) return;
        var h = new Incidente();
        marca(h, fila, orden, actor);
        h.setTipo(catalogos.obtener("TIPO_INCIDENCIA", valor(fila,"tipo")));
        h.setClase("novedad".equals(valor(fila,"clase")) ? "NOVEDAD" : "INCIDENCIA");
        h.setFecha(fecha(fila,"fecha"));
        h.setTitulo(valor(fila, "titulo"));
        h.setDetalle(valor(fila, "detalle"));
        h.setUbicacion(valor(fila, "ubicacion"));
        h.setRequiereEvaluacion(fila.path("requiereEvaluacion").asBoolean() ? 1 : 0);
        var origen = fila.path("origen");
        h.setOrigen(mayus(valor(origen,"tipo")));
        h.setCentro(centros.findByCodigo(valor(fila, "carId")).orElseThrow());
        var idAmbiente = valor(fila,"ambienteId");
        if (idAmbiente == null) {
            h.setNombreOrigen(h.getCentro().nombre());
        } else {
            var ambiente = reglas.ambiente(idAmbiente);
            h.setAmbiente(ambiente);
            h.setModulo(ambiente.modulo());
            if ("AMBIENTE".equals(h.getOrigen())) {
                h.setNombreOrigen(ambiente.getNombre());
                h.setNombrePadre(h.getCentro().nombre() + " › " + ambiente.modulo().getNombre());
            } else {
                var bien = reglas.buscar(valor(origen, "id"));
                h.setBienOrigen(bien);
                h.setPrincipalOrigen(bien.getPrincipal());
                h.setNombreOrigen(bien.getNombre());
                h.setNombrePadre(bien.getPrincipal() == null ? reglas.etiquetaAmbiente(ambiente) : bien.getPrincipal().getNombre());
            }
        }
        incidentes.save(h);
        for (var id : fila.path("bienIds")) {
            var b = reglas.buscar(id.asText());
            var referido = fila.path("evaluaciones").path(id.asText());
            var afectado = vincular("AFECTADO", b, actor);
            afectado.setIncidente(h);
            afectado.setCantidad(referido.path("unidades").asInt(b.getCantidad()));
            afectado.setRequiereReposicion(referido.path("requiereReposicion").asBoolean() ? 1 : 0);
            afectado.setFuente(referido.hasNonNull("unidades") ? "INDIVIDUAL" : "HISTORICA");
            implicados.save(afectado);
        }
        if (fila.hasNonNull("atencion")) {
            var dato = fila.path("atencion");
            var a = new Atencion();
            a.setIncidente(h);
            a.setFecha(fecha(dato,"fecha"));
            a.setDetalle(valor(dato, "detalle"));
            a.setAutorReferencia(valor(dato, "por"));
            a.registrar(actor);
            atenciones.save(a);
        }
    }

    private BienImplicado vincular(String rol, Bien bien, Usuario actor) {
        var dato = new BienImplicado();
        dato.setRol(rol);
        dato.setBien(bien);
        dato.registrar(actor);
        return dato;
    }

    private void marca(HechoAuditable hecho, JsonNode source, int orden, Usuario actor) {
        hecho.setCodigo(valor(source, "id"));
        hecho.setAutorReferencia(valor(source, "informadoPor"));
        hecho.setOrdenImportacion(orden);
        hecho.registrar(actor);
    }

    private Bien primerBien(JsonNode fila) { return reglas.buscar(fila.path("bienIds").get(0).asText()); }
    private String valor(JsonNode fila, String campo) { return fila.path(campo).asText(null); }
    private String mayus(String texto) { return texto == null ? null : texto.toUpperCase(Locale.ROOT); }
    private LocalDate fecha(JsonNode fila, String campo) { return fila.hasNonNull(campo) ? LocalDate.parse(valor(fila,campo)) : null; }
    private JsonNode leer(String nombre) throws IOException {
        try (var entrada = new ClassPathResource("demo/" + nombre + ".json").getInputStream()) {
            return json.readTree(entrada);
        }
    }
}
