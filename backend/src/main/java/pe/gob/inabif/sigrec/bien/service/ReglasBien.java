package pe.gob.inabif.sigrec.bien.service;

import lombok.RequiredArgsConstructor;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.bien.model.*;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.FechaCorte;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ReglasBien {
    private final BienRepository bienes;
    private final AmbienteRepository ambientes;
    private final HistorialBienRepository historial;
    private final BajaRepository bajas;
    private final BienImplicadoRepository implicados;
    private final CatalogoService catalogos;
    private final CentroService centros;
    private final Acceso acceso;

    public Bien buscar(String rotulo) {
        return bienes.findByRotulo(rotulo).orElseThrow(ReglasBien::noDisponible);
    }

    public Ambiente ambiente(String codigo) {
        return ambientes.findByCodigo(codigo).orElseThrow(ReglasBien::noDisponible);
    }

    public Centro centro(Bien bien) { return centro(bien.getAmbiente()); }

    public Centro centro(Ambiente ambiente) { return ambiente.modulo().centro(); }

    public Centro bloquear(String permiso, Centro centro) {
        acceso.accionCentro(permiso, centro.codigo());
        return centros.bloquear(centro.codigo());
    }

    public Bien bloquear(String permiso, String codigo) {
        var bien = buscar(codigo);
        bloquear(permiso, centro(bien));
        bienes.refresh(bien);
        return bien;
    }

    public Optional<Baja> baja(Bien bien) {
        return bajas.findByBienId(bien.id()).stream().filter(Baja::vigente).findFirst();
    }

    public boolean activo(Bien bien) { return bien.vigente() && baja(bien).isEmpty(); }

    public void exigirActivo(Bien bien) {
        if (!activo(bien)) throw conflicto("El bien debe estar activo.");
    }

    public void exigirAmbienteVigente(Ambiente ambiente) {
        if (!ambiente.vigente() || !ambiente.modulo().vigente() || !centro(ambiente).vigente()) {
            throw conflicto("El ambiente o sus antecedentes no están vigentes.");
        }
    }

    public List<Bien> componentes(Bien bien) {
        return bien.id() == null ? List.of() : bienes.findByPrincipalIdOrderById(bien.id()).stream()
                .filter(Bien::vigente).toList();
    }

    public void cambiarPrincipal(Bien componente, Bien principal, String posicion) {
        if (principal != null && (principal.getRotulo().equals(componente.getRotulo()) || !activo(principal)
                || !principal.getAmbiente().id().equals(componente.getAmbiente().id())
                || principal.getPrincipal() != null || !componentes(componente).isEmpty())) {
            throw invalido("Asociación no permitida.");
        }
        componente.setPrincipal(principal);
        componente.setPosicion(principal == null ? null : (posicion == null || posicion.isBlank() ? "No informada" : posicion.strip()));
    }

    public boolean revisionPendiente(Bien bien) {
        return implicados.findByBienIdOrderById(bien.id()).stream().anyMatch(this::pendiente);
    }

    public boolean impideAnularAmbiente(Ambiente ambiente) {
        return bienes.findByAmbienteId(ambiente.id()).stream()
                .anyMatch(b -> b.vigente() && (activo(b) || revisionPendiente(b)));
    }

    public void resolverRevision(Bien bien, String resolucion, LocalDate fecha, Usuario actor) {
        for (var dato : implicados.findByBienIdOrderById(bien.id()).stream().filter(this::pendiente).toList()) {
            dato.setResolucion(resolucion);
            dato.setFechaResolucion(fecha(fecha));
            dato.actualizar(actor);
        }
    }

    private boolean pendiente(BienImplicado dato) {
        return dato.vigente() && "COMPONENTE".equals(dato.getRol()) && dato.getBaja().vigente() && dato.getResolucion() == null;
    }

    public void cambiarCondicion(Bien bien, String codigo, String detalle, LocalDate fecha, Incidente incidente, Usuario actor) {
        if (codigo == null) return;
        var anterior = bien.getCondicion();
        var nueva = catalogos.obtener("CONDICION", codigo);
        if (anterior != null && anterior.id().equals(nueva.id())) return;
        bien.setCondicion(nueva);
        bien.actualizar(actor);
        var hecho = evento(bien, "CONDICION", "Condición: " + etiqueta(anterior) + " → " + nueva.nombre(), detalle, fecha, actor);
        hecho.setCondicionAnterior(anterior);
        hecho.setCondicionNueva(nueva);
        hecho.setIncidente(incidente);
        historial.save(hecho);
    }

    private String etiqueta(Catalogo dato) { return dato == null ? "No constatable" : dato.nombre(); }

    public HistorialBien evento(Bien bien, String tipo, String titulo, String detalle, LocalDate fecha, Usuario actor) {
        var evento = new HistorialBien();
        evento.asignarCodigo("EV-");
        evento.setTipo(tipo);
        evento.setFecha(fecha(fecha));
        evento.setBien(bien);
        evento.setAmbiente(bien.getAmbiente());
        evento.setTitulo(titulo);
        evento.setDetalle(detalle);
        evento.registrar(actor);
        return evento;
    }

    public String etiquetaAmbiente(Ambiente ambiente) {
        return ambiente.modulo().getNombre() + " › " + ambiente.getNombre();
    }

    public static LocalDate fecha(LocalDate fecha) {
        var date = fecha == null ? FechaCorte.DIA : fecha;
        if (date.isAfter(FechaCorte.DIA)) throw invalido("La fecha no puede ser posterior a la fecha de corte.");
        return date;
    }

    public static String codigo(String entrada) { return entrada.strip().toUpperCase(Locale.ROOT); }
    public static ResponseStatusException noDisponible() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no disponible."); }
    public static ResponseStatusException conflicto(String mensaje) { return new ResponseStatusException(HttpStatus.CONFLICT, mensaje); }
    public static ResponseStatusException invalido(String mensaje) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje); }
}
