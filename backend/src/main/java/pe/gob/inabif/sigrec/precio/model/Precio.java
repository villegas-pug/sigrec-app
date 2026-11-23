package pe.gob.inabif.sigrec.precio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@Entity
@Table(name = "SGR_PRECIO",
        uniqueConstraints = @UniqueConstraint(name = "IX_PLA_PRE_TIPO_VIG", columnNames = "TIPO_VIGENTE"),
        indexes = {
            @Index(name = "IX_PLA_PRE_BIE_TIP", columnList = "ID_TIPO_BIEN"),
            @Index(name = "IX_PLA_PRE_USU_REE", columnList = "ID_REEMPLAZA_USUARIO"),
            @Index(name = "IX_PLA_PRE_USU_REG", columnList = "USU_REGISTRA"),
            @Index(name = "IX_PLA_PRE_USU_ACT", columnList = "USU_ACTUALIZA"),
            @Index(name = "IX_PLA_PRE_USU_ELI", columnList = "USU_ELIMINA")
        })
@AssociationOverrides({
    @AssociationOverride(name = "registradoPor", joinColumns = @JoinColumn(name = "USU_REGISTRA", nullable = false),
            foreignKey = @ForeignKey(name = "FK_PLA_PRE_USU_REG")),
    @AssociationOverride(name = "actualizadoPor", joinColumns = @JoinColumn(name = "USU_ACTUALIZA"),
            foreignKey = @ForeignKey(name = "FK_PLA_PRE_USU_ACT")),
    @AssociationOverride(name = "anuladoPor", joinColumns = @JoinColumn(name = "USU_ELIMINA"),
            foreignKey = @ForeignKey(name = "FK_PLA_PRE_USU_ELI"))
})
@Check(name = "CK_PLA_PRE_MONTO_PRECIO", constraints = "MONTO_PRECIO > 0")
@Check(name = "CK_PLA_PRE_FEC_PRECIO", constraints = "FEC_PRECIO = TRUNC(FEC_PRECIO, 'MM')")
@Check(name = "CK_PLA_PRE_REEMPLAZA", constraints = "FEC_REEMPLAZA IS NOT NULL OR ID_REEMPLAZA_USUARIO IS NULL")
@Check(name = "CK_PLA_PRE_ESTADO", constraints = "ESTADO IN (0, 1)")
@Check(name = "CK_PLA_PRE_ELIMINADO", constraints = "ELIMINADO IN (0, 1)")
@Check(name = "CK_PLA_PRE_AUD_ACT", constraints = "(USU_ACTUALIZA IS NULL AND FEC_ACTUALIZA IS NULL) OR "
        + "(USU_ACTUALIZA IS NOT NULL AND FEC_ACTUALIZA IS NOT NULL)")
@Check(name = "CK_PLA_PRE_AUD_ELI", constraints = "(ELIMINADO = 0 AND USU_ELIMINA IS NULL AND FEC_ELIMINA IS NULL AND MOTIVO_ELIMINA IS NULL) OR "
        + "(ELIMINADO = 1 AND USU_ELIMINA IS NOT NULL AND FEC_ELIMINA IS NOT NULL AND TRIM(MOTIVO_ELIMINA) IS NOT NULL)")
public class Precio extends Auditable {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_BIEN", nullable = false, foreignKey = @ForeignKey(name = "FK_PLA_PRE_BIE_TIP"))
    private Catalogo tipo;

    @Column(name = "MONTO_PRECIO", nullable = false, precision = 14, scale = 2)
    private BigDecimal precio;

    @Column(name = "FEC_PRECIO")
    private LocalDate fechaPrecio;

    @Column(name = "PROCEDENCIA", length = 1000)
    private String procedencia;

    @Column(name = "FEC_REEMPLAZA", columnDefinition = "DATE")
    private LocalDateTime reemplazadoEl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_REEMPLAZA_USUARIO", foreignKey = @ForeignKey(name = "FK_PLA_PRE_USU_REE"))
    private Usuario reemplazadoPor;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND FEC_REEMPLAZA IS NULL THEN ID_TIPO_BIEN END")
    @Column(name = "TIPO_VIGENTE")
    private Long tipoVigente;

    public boolean esActual() {
        return vigente() && reemplazadoEl == null;
    }

    public boolean coincideCon(PrecioValor valor) {
        return precio.compareTo(valor.precio()) == 0 && Objects.equals(fechaPrecio, valor.fechaPrecio())
                && Objects.equals(procedencia, valor.procedencia());
    }

    public void reemplazar(Usuario actor, LocalDate fecha) {
        reemplazadoEl = fecha.atStartOfDay();
        reemplazadoPor = actor;
        actualizar(actor);
    }
}
