package pe.gob.inabif.sigrec.shared.model;

import pe.gob.inabif.sigrec.usuario.model.Usuario;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;

@MappedSuperclass
public abstract class Auditable {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @Column(name = "ESTADO", nullable = false)
    private int estado = 1;
    @Column(name = "ELIMINADO", nullable = false)
    private int eliminado;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USU_REGISTRA", nullable = false)
    private Usuario registradoPor;
    @Column(name = "FEC_REGISTRA", nullable = false)
    private LocalDateTime registradoEl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USU_ACTUALIZA")
    private Usuario actualizadoPor;
    @Column(name = "FEC_ACTUALIZA")
    private LocalDateTime actualizadoEl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USU_ELIMINA")
    private Usuario anuladoPor;
    @Column(name = "FEC_ELIMINA")
    private LocalDateTime anuladoEl;
    @Column(name = "MOTIVO_ELIMINA", length = 500)
    private String motivo;

    public Long id() { return id; }
    public String autorRegistro() { return registradoPor == null ? null : registradoPor.nombre(); }
    public Long autorRegistroId() { return registradoPor == null ? null : registradoPor.id(); }
    public LocalDateTime fechaRegistro() { return registradoEl; }
    public LocalDateTime fechaCambio() { return actualizadoEl == null ? registradoEl : actualizadoEl; }
    public boolean vigente() { return estado == 1 && eliminado == 0; }
    public Sello actualizacion() { return sello(actualizadoPor, actualizadoEl, null); }
    public Sello anulacion() { return sello(anuladoPor, anuladoEl, motivo); }

    private Sello sello(Usuario autor, LocalDateTime fecha, String motivo) {
        return fecha == null ? null : new Sello(fecha.toLocalDate().toString(), autor.nombre(), motivo);
    }

    public void registrar(Usuario actor) {
        registrar(actor, null);
    }

    public void registrar(Usuario actor, LocalDateTime fecha) {
        registradoPor = actor;
        registradoEl = fecha == null ? LocalDateTime.now(LIMA) : fecha;
    }

    public void actualizar(Usuario actor) {
        actualizadoPor = actor;
        actualizadoEl = LocalDateTime.now(LIMA);
    }

    public void anular(Usuario actor, String motivo) {
        estado = 0;
        eliminado = 1;
        anuladoPor = actor;
        anuladoEl = LocalDateTime.now(LIMA);
        this.motivo = motivo;
    }

    public void reactivar(Usuario actor) {
        estado = 1;
        eliminado = 0;
        anuladoPor = null;
        anuladoEl = null;
        motivo = null;
        actualizar(actor);
    }

    public record Sello(String fecha, String por, String motivo) {}
}
